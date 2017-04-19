'use strict';

/**
 *@module parser
 */ 

const optPtn = /(--|-(?!\d))([a-z$@#*&]\S*)/.source,
	  optionValStrRgx =/(?:^|\s)(--|-(?!\d))([a-z$@#*&]*)(?=\s+|=|$)(?:\s*(?:\s|=)\s*(\S(?!--|-\D)(?:.(?!--|-\D))*))?/gi, 

	  leadValStrRgx=/^\s*(\S(?:.(?!--|-\D))*)/gi,
	  terminalStrRgx=/(?:^|\s)--\s+(\S.*\S)\s*$/i,
	  valuesRgx = /([^'"`\s=][^\s=]*|(['"`])(.+?)\2)/gi,

	  regex = {
		  optionValStrRgx,
		  leadValStrRgx,
		  terminalStrRgx,
		  valuesRgx
	  } ;


/**
 *
 * @param str
 * @param rgx
 * @param callback
 */
function regexExec( str, rgx, callback ){
	if( !rgx.global ){ rgx = new RegExp( rgx, rgx.flags+'g' );} 
	let match; 

	while( (match = rgx.exec( str )) !== null ){
		if( match.index === rgx.lastIndex ){ rgx.lastIndex++;}
		else{ callback( match );}
	} 
}

/**
 *
 * @param str
 * @param stripQuotes
 * @return {Array}
 */
function parseValueStr(str, stripQuotes=true){
  let values=[];	

  regexExec(str,valuesRgx,match=>{
			let [, str, quote, unQuotedStr] = match,
			val = stripQuotes && quote? unQuotedStr: str
			; 
			values.push(val);
  });
  return values;
}

/**
 *
 * @return {*}
 * @constructor
 */
function Entries(){
	return Object.create({

			  update( option, values, type ){
				  if( !this[option] ){
					  return this[option] = { values, type };
				  }
				  return this[option].values.push( ...values );
			  }

		  } );
}

/**
 *
 * @param cmdStr
 * @param stripQuotes
 * @return {*}
 */
function parse( cmdStr,{stripQuotes=true}={} ){
	let entries = Entries();

	//Parse the leading values............................
	let [,leadStr, remainder] = cmdStr.split(leadValStrRgx),
		leadVals= parseValueStr(leadStr,stripQuotes)
		; 
		entries.update('_',leadVals,'_');

	//Parse the trailing values...........................
	let [optValuesStr,terminalStr] = remainder.split(terminalStrRgx), 
		terminalVals=parseValueStr(terminalStr,stripQuotes) 
		;
	entries.update('--',terminalVals,'__');


	//Parse the options valueStr sequences................
	regexExec( optValuesStr, optionValStrRgx, match =>{
		let [,type,option,valueStr = '']=match, 
		values = parseValueStr(valueStr,stripQuotes)
		; 
		entries.update(option,values,type);
	} );

	return entries;
}

Object.assign(parse,{
	regex,
	regexExec,
	parseValueStr
});

module.exports = parse;
