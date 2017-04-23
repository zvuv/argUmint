'use strict';

/**
 *@module parser
 */


const
	  optionPtn = String.raw`(?:^|\s)(--|-(?=\D))((?:[a-z$@#*&]\S*)|\s)`,
	  valuePtn = String.raw`([^'"\`\s=][^\s=]*)`,
	  qtStringPtn = `(['"\`])(.+)\\4`,
	  regex = new RegExp( `${optionPtn}|${valuePtn}|${qtStringPtn}`, 'gi' )
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
class Entries {

	constructor( option, type , value){
		this.update( option, type, value);
		this.update('_',optionTypes.u);
		this.update('__',optionTypes.uu);
	}

	update( option, type, value){
		if( !option ){return;}

		if( !this[option] ){ this[option] = { values: [], type }; }

		if( value ){value = value.trim();}
		if( !value ){return;}

		this[option].values.push( value );
	}
}

const optionTypes = { 'h': '-', 'hh': '--', 'u': '_', 'uu': '__' };

/**
 *
 * @param cmdStr
 * @param stripQuotes
 * @return {*}
 */
function parse( cmdStr, stripQuotes = true ){

	let currentOpt = '_', // name is same as type.
		  currentType = optionTypes.u,
		  entries = new Entries()
		  ;

	regexExec( cmdStr, regex, match =>{

		let [matchedStr,optLdr,optName,value,qt, unQtString]=match;

		if( optLdr !== undefined ){

			// trailing values.  Don't care what type of token...
			if( currentType == optionTypes.uu ){ value = matchedStr; }

			// start of trailing values.......
			else if( '--' == optLdr && !optName.trim() ){
				currentOpt = '__';
				currentType = optionTypes.uu;
			}

			//found an option token................
			else{
				currentOpt = optName;
				currentType = optLdr;
			}

		}
		else if( value === undefined ){
			value = stripQuotes? unQtString: matchedStr;
		}
		//else{ its a value token and no action was needed }

		entries.update( currentOpt, currentType, value );

	} );

	return entries;
}

module.exports = parse;
module.exports.optionTypes = optionTypes;
module.exports.test={Entries};
