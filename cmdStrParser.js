'use strict';

/**
 *@module parser
 */


const
	  optionPtn = String.raw`(?:^|\s)(--|-(?=\D))((?:[a-z$@#*&_][^\s=]*)|\s)`,
	  valuePtn = String.raw`([^'"\`\s=][^\s=]*)`,
	  qtStringPtn = `(['"\`])(.+)\\4`,
	  regex = new RegExp( `${optionPtn}|${valuePtn}|${qtStringPtn}`, 'gi' ), 

	  OPTIONTYPES = {
		  flag: '-',
		  option: '--',
		  leading: '_',
		  trailing: '__' 
	  };

/**
 * Wrapper to civilize the RegExp exec fcn.
 * Passes each match to the callback fcn
 *
 * @param text
 * @param regex
 * @param callback
 */
function regexExec( text, regex, callback ){
	if( !regex.global ){ regex = new RegExp( rgx, rgx.flags+'g' );}
	let match;

	while( (match = regex.exec( text )) !== null ){ 

		if( match.index === regex.lastIndex ){
			regex.lastIndex++; //don't get stuck on zero length matches
		}
		else{ callback( match );}

	}
}

/**
 * Builds a table of (option, info) entries where each 
 * entry is an object { values:[], type:OPTIONTYPE }.
 *
 * Rejects falsy or blank string values
 *
 * Always has entries for _ && __ whether they have values
 * or not.
 *
 * @return {Object}
 * @constructor
 */
class Entries {

	constructor( option, type , value){
		this.update( option, type, value);
		this.update( '_', OPTIONTYPES.leading);
		this.update( '__', OPTIONTYPES.trailing);
	}

	update( option, type, value){

		if(!option){return;}

		if( !(option in this) ){ this[option] = { values: [], type }; }

		if( !value || !(value = value.trim()) ){return;}

		this[option].values.push( value );
	}
}


/**
 * Option tokens have the form  --option or -flag and can be 
 * followed by a string of values which are anything preceded
 * by  space or =  character.  
 *
 * For quoted string values, the outer quotes are  removed 
 * by default.  If stripQuotes = false, they will be retained.
 *
 * Leading values not preceded by an option are assigned to the
 * _ option.   
 *
 * Trailing values, anything following the -- option are assigned
 * to the __ option regardless of whether they look like options
 * or values.
 *
 * @param cmdStr
 * @param stripQuotes
 * @return {Entries}
 */
function parse( cmdStr, stripQuotes = true ){

	let currentOpt = '_', // name is same as type.
		  currentType = OPTIONTYPES.leading,
		  entries = new Entries()
		  ;

	regexExec( cmdStr, regex, match =>{

		let [matchedStr,optLdr,optName,value,qt, unQtString]=match;

		if( optLdr ){

			// trailing values.  Don't care what type of token...
			if( currentType == OPTIONTYPES.trailing ){ value = matchedStr; }

			// start of trailing values.......
			else if( '--' == optLdr && !optName.trim() ){
				currentOpt = '__';
				currentType = OPTIONTYPES.trailing;
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
module.exports.OPTIONTYPES = OPTIONTYPES;
module.exports._$test={Entries};
