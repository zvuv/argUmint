'use strict';

/**
 *@module argUmint
 */

const parser = require( './parser' ),
	  optionTypes=parser.optionTypes,
	  typeEvaluators = require( './types' )
	  ;

//.................................................
//utility functions                               .
//.................................................

const keysOf = Object.keys;

function isString( obj ){
	return toString.call( obj ) == '[object String]';
}

function isObject( x ){
	return !(x instanceof String)
		  && !Array.isArray( x )
		  && !(x instanceof Function)
		  && Object( x ) === x;
}

/**
 * Deep merge of objects with object properties.
 * Does not support arrays.
 * @param {Object} ...srcs objects to be merged
 * @return {Object} new object with merged properties.
 */
function mergeObjs( ...srcs ){
	let tgt = {};

	function merge( tgt, src ){
		keysOf( src ).forEach( key =>{
			let prop = src[key];

			if( isObject( prop ) ){
				merge( tgt[key] || (tgt[key] = {}), prop );
			}
			else if( Array.isArray( prop ) ){
				throw new TypeError( `merge does not support arrays` );
			}
			else{ tgt[key] = prop;}

		} );
	}

	srcs.forEach( src => merge( tgt, src ) );
	return tgt;
}

//default config object..................................
const defaultConfig = {
	stripQuotes: true,
	defaults   : {},
	aliases    : {},
	typed      : { '_': 'noop', '__': 'noop' },
	types      : {}
};


/**
 *
 * @param args
 * @return {*}
 * @constructor
 */
function ArgUmint( ...args ){

	//process arguments...................................
	let cmdStr = '', config = {}, [p0,p1]=args;


	if( isObject( p0 ) ){ config = p0; }
	else if( isString( p0 ) || Array.isArray(p0)){ [cmdStr, config = {}] = [p0, p1];}
	else{ throw new TypeError( `parameters are of the wrong type` );}

	config = mergeObjs( defaultConfig, config );

	let { defaults, typed, types, aliases }=config;

	//make a doubly linked copy of the aliases.............
	keysOf( aliases ).forEach( key => aliases[aliases[key]] = key);

	//extend the defaults to include aliases............
	keysOf( defaults ).forEach( key =>{
		let alias = aliases[key];
		if( !alias || defaults[alias] !== undefined ){return;}
		defaults[alias] = defaults[key];
	} );

	//extend the list of typed options to include aliases............
	keysOf( typed ).forEach( key =>{
		let alias = aliases[key];
		if( alias && !typed[alias] ){typed[alias] = typed[key];}
	} );

	//custom type typeEvaluators................................
	keysOf( types ).forEach( key => typeEvaluators[key] = types[key] );


	/**
	 *
	 * @param cmdStr
	 * @return {Object} dictionary of Name Value pairs.
	 */
	function argUmint( cmdStr ){

		if(Array.isArray(cmdStr)){ cmdStr = cmdStr.join('');}

		if(!cmdStr){return {};}

		let entries = parser( cmdStr, config.stripQuotes );

		//replace flag clusters with individual flags.............
		keysOf( entries )
			  .filter( key => entries[key].type == optionTypes['-'] && key.length > 1 )
			  .forEach( key =>{
				  [...key].forEach( k => entries[k] = entries[key] );
				  delete entries[key];
			  } );

		//evaluate the entries and build a dictionary of N,V pairs
		let dict = keysOf( entries ).reduce( ( o, key ) =>{
			let entry = entries[key],
				  type = typed[key] || 'default',
				  alias = aliases[key],
				  info = {
					  option    : key,
					  optionType: entries[key].type,
					  default   : defaults[key]
				  };

			o[key] = typeEvaluators[type]( entry.values, info );

			if( alias && !entries[alias] ){ o[alias] = o[key]; }

			return o;
		}, {} );

		//apply defaults........................................
		keysOf( defaults ).forEach( key =>{
			if( !dict[key] ){dict[key] = defaults[key];}
		} );

		return dict;
	}

	return cmdStr? argUmint( cmdStr ): argUmint;

}

module.exports = ArgUmint;
