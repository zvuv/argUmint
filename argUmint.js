'use strict';

/**
 *@module argUmint
 */

const parser = require( './parser' ),
	  evaluators = require( './typeEvaluators' ),
	  { keysOf, mergeObjs, cloneObj, isObject, isString }= require( './_u' )
	  ;

const defaultConfig = {
	stripQuotes: true,
	defaults   : {},
	aliases    : {},
	typed      : {'_':'noop', '--':'noop'},
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

	if( Array.isArray( p0 ) ){p0 = p0.join( '' );}

	if( isString( p0 ) ){ [cmdStr, config = {}] = [p0, p1];}
	else if( isObject( p0 ) ){ config = p0; }
	else{ throw new TypeError( `parameters are of the wrong type` );}

	config = mergeObjs( defaultConfig, config );

	//make a doubly linked copy of the aliases.............
	const aliases = keysOf( config.aliases ).reduce( ( o, key ) =>{
		let alias = config.aliases[key];
		o[key] = alias;
		o[alias] = key;
		return o;
	}, {} );

	//extend the defaults to include aliases............
	let defaults = cloneObj( config.defaults );

	keysOf( defaults ).forEach( key =>{
		let alias = aliases[key];
		if( !alias || defaults[alias] !== undefined ){return;}
		defaults[alias] = defaults[key];
	} );
	
	//extend the list of typed options to include aliases............
	let typed = cloneObj(config.typed);
	keysOf(typed).forEach(key=>{
		let alias = aliases[key];
		if(alias && ! typed[alias]){typed[alias]=typed[key];}
	});

	//custom type evaluators................................
	let types=cloneObj(config.types);
	keysOf(types).forEach(key=> evaluators[key]=types[key]);

	/**
	 *
	 * @param cmdStr
	 * @return {*}
	 */
	function argUmint( cmdStr ){

		let entries = parser( cmdStr, config.stripQuotes );

		//replace flag clusters with individual flags...
		keysOf( entries ).forEach( key =>{
			let entry = entries[key];
			if( entry.type === '-' ){
				delete entries[key];
				[...key].forEach( k => entries[k] = entry );
			}
		} );

		//evaluate the entry values.....................
		let dict = keysOf( entries ).reduce( ( o, key ) =>{
			let entry = entries[key],
				type = typed[key] || 'default',
				info = {option:key,optionType:entries[key].type,default:defaults[key]}
				;

			o[key] = evaluators[type]( entry.values,info);
			return o;
		}, {} );

		//include aliases...............................
		keysOf( dict ).forEach( key =>{
			let alias = aliases[key];
			if( alias && !dict[alias] ){dict[alias] = dict[key];}
		} );

		//apply defaults..................................  
		keysOf( defaults ).forEach( key =>{
			if( !dict[key] ){dict[key] = defaults[key];}
		} );

		return dict;
	}

	if( cmdStr ){return argUmint( cmdStr );}

	return argUmint;
}

module.exports = ArgUmint;
