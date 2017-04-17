'use strict';

/**
 *@module argU.js
 */

let keysOf = Object.keys;

function regexExec( str, regex, callback ){
	let match;
	if( !regex.global ){ regex = new RegExp( regex, regex.flags+'g' );}

	while( (match = regex.exec( str )) !== null ){
		if( match.index === regex.lastIndex ){ regex.lastIndex++; }
		callback( match );
	}
}

//.........................................................
//Name Value pairs generated from parsing the arg tokens
//Values for each entry are held in an array
//.........................................................
function NVtable(){

	let table = Object.create( NVtable.proto );

	table.register( '_', tokenize.leading );

	return table;
}

NVtable.proto = {

	register( name, type ){

		if( !this[name] ){
			this[name] = { values: [], optionType: type };
			return true;
		}

		return false;
	},

	appendVal( name, value ){ this[name].values.push( value );}
};

//.........................................................
//Parser lookup table for all typed entries...............
//.........................................................
function ParserTable( typed = {}, aliases = {}, types ){

	//update the parsers list with any user defined types..
	keysOf( types ).forEach( key => parsers[key] = types[key] );

	let table = Object.create( ParserTable.proto );

	//an entry for every typed option......................
	keysOf( typed ).reduce( ( o, option ) =>{
		let type = typed[option];
		o[option] = parsers[type];
		return o;
	}, table );

	//and for their aliases................................
	keysOf( table ).forEach( key =>{
		let alias = aliases[key];
		table[alias] = table[key];
	} );

	return table;
}

ParserTable.proto = {
	getParser( name ){ return this[name] || parsers.default;}
};

function tokenize( cmdStr ){
	const  ptnHyphenOpt = /(-(?!\d)|--)([^'"`=\s-][^'"`=\s]*)/.source,
			 ptnValue = /(^|\s|=\s*)(?!-\D)([^'"`\s=][^=\s]+|([`'"]).*?\7)/.source,
			 rgxToken = new RegExp(`${ptnHyphenOpt}|${ptnValue}`,'gi')
			 ;
	
	function isEmpty(str){return !str || !str.trim();}

	let tokens = [];

	// strip off any leading values and assign them to '_'
	let [leadStr,remainderStr]=cmdStr.split(/(?:\s|^)((?=--?\D).*$)/,2);

	tokens.push(['_', '_']);

	let values = leadStr
		.split(' ')
		.filter(str=>!isEmpty(str))
		.map(val=>['=',val]);	

	tokens.push(...values);


	
	//strip off any trailing values and assign them to '__'
	tokens.push(['__','__']);

   let [mainStr,tailStr='']= remainderStr.split('__',2);

	 values = tailStr
		.split(' ')
		.filter(str=>!isEmpty(str))
		.map(val=>['=',val]);	

	tokens.push(...values);


	regexExec( mainStr, rgxToken, match =>{

		let token;
		let [,hyphen,option,equ,value] = match;

		if(hyphen){
			token = [hyphen,option];
		}
		if(equ){
			token =  ['=',value]; 
		}

		tokens.push(token);

	 });

	return tokens;
}

Object.assign( tokenize,
               {
	               value    : '=',
	               flag     : '-',
	               option   : '--',
	               leading: '_',
	               terminal : '__'
               }
);


//.........................................................
//Parsers
//.........................................................
let parsers = {

	noop ( val ){
		return val;
	},

	default( valArray, optionType ){

		if( optionType == tokenize.leading ){
			return valArray;
		}

		switch(valArray.length) {

			case 0:
				return true;
				break;

			case 1:
				return valArray[0];
				break;

			default:
				return valArray;

		}
	},

	string( valArray, optionType ){
		if( !valArray.length ){return;}
		return valArray.join( ' ' );
	},

	boolean( valArray, optionType ){

		if( valArray.length ){
			let [str]=valArray;

			switch(str.toLowerCase().trim()) {
				case "true":
					return true;
				case "false":
				case "no":
				case "0":
				case null:
					return false;
				default:
					return Boolean( str );
			}

			return Boolean( valArray );
		}
	},

	numeric( valArray, optionType ){

		if( !valArray.length ){return;}

		let [str]=valArray;
		return Number( str.trim() );
	},

	json( valArray, optionType ){
		if( !valArray.length ){return;}

		let str = valArray.join( '' )
		                  .trim()
		                  //wrap field names in quotes...............
		                  .replace( /([{,])\s*([a-z_$][\w\_\$]*)\s*:/gi, '$1 "$2":' )
		                  //replace single with double quotes
		                  .replace( /([{\[:,]\s*)('([^']+)')/gi, '$1"$3"' )
			  ;

		return JSON.parse( str );
	},

	get attributes(){return parsers.noop;}
};


const defaultConfig = {
	options : {},
	defaults: {},
	aliases : {},
	typed   : {
		_ : 'noop',
		__: 'noop'
	},
	types   : {}
};

//.........................................................
//ArgU
//.........................................................
function ArgU( ...args ){

	let cmdStr = '', config = {};

	if( typeof args[0] === 'string' || Array.isArray( args[0] ) ){
		[cmdStr, config] = args;
	}
	else if( args[0] === Object( args[0] ) ){ config = args[0]; }
	else{ throw new TypeError( `parameters are of the wrong type` );}

	//merge config objects...................................
	config = keysOf( defaultConfig ).reduce( ( o, key ) =>{
		o[key] = {};
		Object.assign( o[key], defaultConfig[key], config[key] || {} );
		return o;
	}, {} );

	const aliases = config.aliases;

	//extend the alias dictionary with reverse mappings
	keysOf( aliases ).forEach( key =>{
		let val = aliases[key];
		aliases[val] = key;
	} );

	let parserTable = ParserTable( config.typed, aliases, config.types );

	function argU( cmdStr ){

		let nvTable = NVtable();

		//process the args and build the NVtable......
		if( Array.isArray( cmdStr ) ){cmdStr = cmdStr.join( ' ' );}

		let tokens = tokenize( cmdStr ),
			  currentOption ;

		while( tokens.length > 0 ){

			for(
				var [ tokenType, data ]= tokens.shift();
				tokenType==tokenize.value;
				[ tokenType, data]= tokens.shift()||['','']
			){ nvTable.appendVal( currentOption, data ); }

			if(tokenType){
				currentOption = data;
				nvTable.register( currentOption, tokenType );
			}

		}

		//replace flag cluster entries with individual flag entries
		keysOf( nvTable ).forEach( key =>{
			let entry = nvTable[key];

			if( entry.optionType === tokenize.flag && key.length > 1 ){
				delete nvTable[key];
				[...key].forEach( flag => nvTable[flag] = entry );
			}

		} );

		//Populate dictionary of name, parse value pairs............
		let dictionary = keysOf( nvTable ).reduce( ( dict, key ) =>{

			let entry = nvTable[key],
				  parser = parserTable.getParser( key )
				  ;

			dict[key] = parser( entry.values, entry.type );

			return dict;
		}, {} );

		//apply the defaults......................................
		keysOf( config.defaults ).forEach( key =>{
			if( dictionary[key] === undefined ){
				dictionary[key] = config.defaults[key];
			}
		} );

		//duplicate entries for aliases.................................
		keysOf( dictionary ).forEach(
			  key =>{
				  let alias = aliases[key];
				  if( alias ){ dictionary[alias] = dictionary[key]; }
			  }
		);

		return dictionary;
	}

	argU.parsers = parsers;

	if( cmdStr ){return argU( cmdStr );}
	else{ return argU;}

}

module.exports = ArgU;
module.exports.parsers = parsers;
