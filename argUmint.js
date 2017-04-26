'use strict';

/**
 *@module argUmint
 */

const cmdStrParser = require( './cmdStrParser' ),
	  OPTIONTYPES = cmdStrParser.OPTIONTYPES,
	  typeEvaluators = require( './evaluators' )
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
		  // && !Array.isArray( x )
		  && !(x instanceof Function)
		  && Object( x ) === x;
}

/**
 * Deep merge of objects with object properties.
 * Merges enumarable own properties
 * @param {Object} tgt target object
 * @param {Object} ...srcs objects to be merged
 * @return {Object} new object with merged properties.
 */
function deepAssign( tgt, ...srcs ){

	function merge( tgt, src ){
		keysOf( src ).forEach( key =>{
			let prop = src[key];

			if( isObject( prop ) ){
				if(!tgt[key]){tgt[key]=Array.isArray(prop)?[]:{};}
				merge( tgt[key] , prop );
			}
			else{ tgt[key] = prop;}

		} );
	}

	srcs.forEach( src => merge( tgt, src ) );

	return tgt;
}

/**
 * Evaluator functions are invoked bound to a context object which 
 * exposes  useful properties and methods including other evaluators
 * and even Argumint itself.  
 *
 * This method is invoked multiple times, adding a link to the 
 * prototype chain with each call.  Finally, it returns a constructor
 * which creates the context instance  and passes the option value to
 * the evaluator which is invoked as a  method and returns the result.
 */
let Evaluator = (function( evaluators, OPTIONTYPES, ArgUmint ){

	let proto = deepAssign({},evaluators,{OPTIONTYPES,ArgUmint});
	proto.base = proto;

	return function( typedOptions = {}, userEvaluators, config = {}){

		proto = Object.create( proto ); 
		//proto.typedOptions = typedOptions;
		deepAssign( proto , userEvaluators, {typedOptions, config });

		return function(cmdStr,rawEntries,argUmint){

			proto = Object.create( proto ); 
			deepAssign(proto,{cmdStr,rawEntries,argUmint});

			return function _Evaluator(  optionName = '', optionType, ...values ){

				let contextObj = Object.create( proto );

				contextObj.values = values;
				contextObj.optionName = optionName;
				contextObj.optionType = optionType;

				let typeName = contextObj.typedOptions[optionName] || 'default';

				return contextObj[typeName]( ...values );
			}; 
		};
	}; 
})( typeEvaluators, OPTIONTYPES, ArgUmint );

//default config object..................................
const defaultConfig = {
	stripQuotes: true,
	defaults   : {},
	aliases    : {},
	typed      : { noop:['_', '__']},
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
	else if( isString( p0 ) || Array.isArray( p0 ) ){ [cmdStr, config = {}] = [p0, p1];}
	else{ throw new TypeError( `parameters are of the wrong type` );}

	config = deepAssign( {}, defaultConfig, config ); 
	let { defaults, typed, types, aliases }=config;

	//extend aliases to be a doubly linked map...................
	keysOf( aliases ).forEach( key => aliases[aliases[key]] = key );

	//extend the defaults to include aliases.....................
	keysOf( defaults ).forEach( key =>{
		let alias = aliases[key];
		if( !alias || defaults[alias] !== undefined ){return;}
		defaults[alias] = defaults[key];
	} );

	//build a dictionary of option,type entries from the 
	//'typed' configuration data
	let typedOptions = keysOf(typed).reduce((tObj,type)=>{
	    let opts = typed[type];

		 if(!opts){return;}
		 if(!Array.isArray(opts)){opts=[opts];}

		 opts.forEach(option=>{
			 tObj[option]=type;
			 let alias = aliases[option];
		    if( alias ){tObj[alias] = type;}
		 });

		 return tObj;
	},{});

	Evaluator = Evaluator( typedOptions, types, config );


	/**
	 *
	 * @param cmdStr
	 * @return {Object} dictionary of Name Value pairs.
	 */
	 function argUmint( cmdStr ){

		if( Array.isArray( cmdStr ) ){ cmdStr = cmdStr.join( '' );}

		if( !cmdStr ){return {};}

		let rawEntries = cmdStrParser( cmdStr, config.stripQuotes );

		//expand flag clusters to individual flags entries...........
		keysOf( rawEntries )
			  .filter( key => rawEntries[key].type == OPTIONTYPES.flag && key.length > 1 )
			  .forEach( key =>{
				  [...key].forEach( flag => rawEntries[flag] = rawEntries[key] );
				  delete rawEntries[key];
			  } );

		Evaluator = Evaluator(cmdStr,rawEntries,argUmint);

		//evaluate the entries and build a dictionary of N,V pairs
		let dict = keysOf( rawEntries ).reduce( ( dictObj, option ) =>{
			let { values, type:optionType } = rawEntries[option];

			dictObj[option] = Evaluator(  option, optionType, ...values );

			//set aliases but only if no value has been supplied for them
			let alias = aliases[option];
			if( alias && !rawEntries[alias] ){ dictObj[alias] = dictObj[option]; }

			return dictObj;
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
