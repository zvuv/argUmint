'use strict';

/**
 *@module parser
 */

let patterns;

{
	const _$ = String.raw,
		  qts = `"'\``,
		  optLdr = _$`(?:--|-\D)`,                           
		  notLdr = _$`(?!--|-\D)`,                           
		  wsLdr = _$`(?:^|\s+)`,                              
							 
		  //list of values
		  valList = _$`${notLdr}(\S(?:\s+${notLdr}|\S)*\S)`,

		  //lead values before any option
		  leadVals = _$`^\s*${valList}` ,                                 

		  //from the first option upto -- or EOL
		  optVals = _$`${wsLdr}(${optLdr}(?:\S(?:\s+(?!--(?:\s|$))|\S)*\S))`, 

		  //everything after --
		  trailingVals = _$`${wsLdr}--\s+(\S.*\S)\s*$`,

		  //complete command string
		  cmdStr = _$`(?:${leadVals})?(?:${optVals})?(?:${trailingVals})?`,

		  bRef = ( n ) => '\\'+n,    //avoid annoying 'Octal esape sequences' error
		  value = _$`([^${qts}\s=][^\s=]*|([${qts})(.+?)${bRef( 2 )})`,
		  option = _$`${wsLdr}(${optLdr})([a-z$@#*&]\S*)`
		  ;

		  patterns = {valList,optVals,leadVals, trailingVals,cmdStr, option,value};
}

const optPtn = /(--|-(?!\d))([a-z$@#*&]\S*)/.source,
	  optionValStrRgx = /(?:^|\s)(--|-(?!\d))([a-z$@#*&]*)(?=\s+|=|$)(?:\s*(?:\s|=)\s*(\S(?!--|-\D)(?:.(?!--|-\D))*))?/gi,
	  leadValStrRgx = /^\s*(?!--|-\D)((?:\s+(?!--|-\D)|\S)*)\S/i,
	  // leadValStrRgx = /^\s*(\S(?:.(?!--|-\D))*)/gi,
	  terminalStrRgx = /(?:^|\s)--\s+(\S.*\S)\s*$/i,
	  valuesRgx = /([^'"`\s=][^\s=]*|(['"`])(.+?)\2)/gi,
	  optionTypes = { '-': '-', '--': '--', '_': '_', '__': '__' }
	  ;

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
 * @param str
 * @param stripQuotes
 * @return {Array}
 */
function parseValueStr( str = '', stripQuotes = true ){
	let values = [];

	regexExec( str, valuesRgx, match =>{
		let [, str, quote, unQuotedStr] = match,
			  val = stripQuotes && quote? unQuotedStr: str
			  ;
		values.push( val );
	} );
	return values;
}


/**
 *
 * @return {*}
 * @constructor
 */
function Entries(){
	return Object.create(Entries.prototype);
}
Entries.protytype={ 
	update( option, values, type ){
		if( !this[option] ){
			return this[option] = { values, type };
		}
		return this[option].values.push( ...values );
	} 
};


/**
 *
 * @param cmdStr
 * @param stripQuotes
 * @return {*}
 */
function parse( cmdStr, { stripQuotes = true }={} ){
	let entries = Entries();

	//Parse the leading values............................
	let splits = cmdStr.split( leadValStrRgx );

	if( splits.length > 1 ){
		let [, leadStr, remainder] = splits,
			  leadVals = parseValueStr( leadStr, stripQuotes );

		entries.update( '_', leadVals, optionTypes._ );
		cmdStr = remainder;
	}

	//Parse the trailing values...........................
	splits = cmdStr.split( terminalStrRgx );

	if( splits.length > 1 ){
		let [optValuesStr,terminalStr] = cmdStr.split( terminalStrRgx ),
			  terminalVals = parseValueStr( terminalStr, stripQuotes )
			  ;

		entries.update( '__', terminalVals, optionTypes.__ );
		cmdStr = optValuesStr;
	}

	//Parse the options valueStr sequences................
	regexExec( cmdStr, optionValStrRgx, match =>{
		let [,type,option,valueStr = '']=match,
			  values = parseValueStr( valueStr, stripQuotes )
			  ;
		entries.update( option, values, type );
	} );

	return entries;
}

module.exports = parse;
module.exports.optionTypes = optionTypes;
module.exports.$test = {
	patterns,
	regexExec,
	parseValueStr
};
