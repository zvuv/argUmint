'use strict';

/**
 *@module parser
 */


const _$=String.raw,
		optionPtn = _$`(?:^|\s)(--|-(?=\D))((?:[a-z$@#*&]\S*)|\s)`,
      valuePtn = _$`([^'"\`\s=][^\s=]*)`,
		qtStringPtn = `(['"\`])(.+)\\4`,
		regex = new RegExp(`${optionPtn}|${valuePtn}|${qtStringPtn}`,'gi')
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
		//don't get stuck on zero length matches.....
		if( match.index === rgx.lastIndex ){ rgx.lastIndex++;}
		else{ callback( match );}
	}
}


/**
 *
 * @return {*}
 * @constructor
 */
function Entries(){
	if(!(this instanceof Entries)){
		return new Entries();
	}
}
Entries.prototype={
	update( option, value, type ){
		if( !this[option] ){ this[option] = { values:[], type }; }
		if(value === undefined || value === null){return;}

		value = value.trim();
		if(value){this[option].values.push( value );}
	}
};


const optionTypes = { 'h': '-', 'hh': '--', 'u': '_', 'uu': '__' };

/**
 *
 * @param cmdStr
 * @param stripQuotes
 * @return {*}
 */
function parse( cmdStr,  stripQuotes = true  ){
	let entries = Entries(),
	currentOpt = '_',
	currentType=optionTypes.u
	;

	regexExec( cmdStr, regex , match =>{
		let [matchedStr,optLdr,optName,value,qt, unQtString]=match;

		if(optLdr!==undefined){

			// trailing values................
			if(currentType == optionTypes.uu){
				value = matchedStr;
			}
			// start of trailing values.......
			else if( '--' == optLdr && !optName.trim() ){
				currentOpt = '__';
				currentType = optionTypes.uu;
			}
			//follow the leader..............
			else{
				currentOpt = optName;
				currentType = optLdr;
			}

		}
		else if(value === undefined){
			value=stripQuotes? unQtString:matchedStr;
		}

		entries.update( currentOpt, value, currentType );
	} );

	return entries;
}

module.exports = parse;
module.exports.optionTypes = optionTypes;
// module.exports.$test = {
// 	regex:regex,
// 	patterns,
// 	regexExec,
// 	parseValueStr
// };
