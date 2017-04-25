'use strict';

/**
 *@module argUmint
 */

const cmdStrParser = require( './cmdStrParser' ),
	  OPTIONTYPES = cmdStrParser.OPTIONTYPES,
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
 * Merges enumarable own properties
 * Supports only arrays containing strings
 * @param {Object} tgt target object
 * @param {Object} ...srcs objects to be merged
 * @return {Object} new object with merged properties.
 */
function mergeObjs( tgt, ...srcs ){

	function merge( tgt, src ){
		keysOf( src ).forEach( key =>{
			let prop = src[key];

			if( isObject( prop ) ){
				merge( tgt[key] || (tgt[key] = {}), prop );
			}
			else if( Array.isArray( prop ) ){
				let tgtArray=tgt[key]; 
				if(!tgtArray){tgt[key]=tgtArray=[];}

				prop.forEach(el=>{
					if(!tgtArray.includes(el)){tgtArray.push(el);}
				});
			}
			else{ tgt[key] = prop;}

		} );
	}

	srcs.forEach( src => merge( tgt, src ) );

	return tgt;
}

const Evaluator = (function( evaluators, OPTIONTYPES ){

	const proto = mergeObjs({},evaluators,{OPTIONTYPES});
	proto.base = proto;

	return function( typedOptions = {}, userEvaluators, info = {} ){

		let userProto = Object.create( proto );

		userProto.user = userProto;
		userProto.typedOptions = typedOptions;
		mergeObjs( userProto, userEvaluators, info );


		function _Evaluator( values = [], optionName = '', optionType ){
			let obj = Object.create( userProto );

			obj.values = values;
			obj.optionName = optionName;
			obj.optionType = optionType;

			let typeName = typedOptions[obj.optionName] || 'default';
			return obj[typeName]( values );
		}

		return _Evaluator;
	};

})( typeEvaluators, OPTIONTYPES );

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

	config = mergeObjs( {}, defaultConfig, config );

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

		 opts.forEach(option=>{
			 tObj[option]=type;
			 let alias = aliases[option];
		    if( alias ){tObj[alias] = type;}
		 });

		 return tObj;
	},{});

	const evaluator = Evaluator(  typedOptions, types, config );

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
			  .filter( key => rawEntries[key].type == OPTIONTYPES['-'] && key.length > 1 )
			  .forEach( key =>{
				  [...key].forEach( k => rawEntries[k] = rawEntries[key] );
				  delete rawEntries[key];
			  } );

		//evaluate the entries and build a dictionary of N,V pairs
		let dict = keysOf( rawEntries ).reduce( ( dictObj, option ) =>{
			let { values, type:optionType } = rawEntries[option];

			dictObj[option] = evaluator( values, option, optionType );

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
