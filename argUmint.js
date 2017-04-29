'use strict';

/**
 *@module argUmint
 */

const cmdStrParser = require( './cmdStrParser' ),
	  //Using the word 'optionType' for a different purpose 
	  //here, so we will call these optionKinds
	  OPTIONKINDS = cmdStrParser.OPTIONTYPES,
	  typeEvaluators = require( './evaluators' )
	  ;

//.................................................
//utility functions                               .
//.................................................

const keysOf = Object.keys;

function isObject( x ){
	return !(x instanceof String)
		  && !(x instanceof Function)
		  && Object( x ) === x
		  ;
}

/**
 * Deep merge of a sequence of objects 
 * Merges enumarable own properties
 * Properties are overwritten from left to right
 */
function deepAssign( tgt, ...srcs ){

	function merge( tgt, src ){
		keysOf( src ).forEach( key =>{
			let prop = src[key];

			if( isObject( prop ) ){
				if(!(key in tgt)){
					tgt[key]=Array.isArray(prop)?[]:{};
				}
				merge( tgt[key] , prop );
			}
			else{ tgt[key] = prop;}

		} );
	}

	srcs.forEach( src => merge( tgt, src ) );

	return tgt;
}

function AndAlias(aliases){ 
	
	//extend aliases to be a doubly linked map...................
	keysOf( aliases ).forEach( key => aliases[aliases[key]] = key );

	return function (tgt, option, overwrite=true){
		if(!(option in aliases)){return;}

		let alias = aliases[option];

		if( !overwrite && alias in tgt ){return;} 

		tgt[alias]=tgt[option];
	};
}

/**
 * evaluator functions are invoked bound to a context object.  This
 * context object which exposes  useful properties and methods ,
 * including other evaluators, may be used by the evaluator functions
 * and also in testing.
 *
 * This factory method is invoked multiple times, adding a link to the 
 * prototype chain with each call.  Finally, it returns a factory
 * which creates the context instance which then invokes one of its 
 * evaluator methods. The context object is not returned, just 
 * the value obtained from invoking the evaluator method.
 */
let Evaluator = (function( evaluators, info ){

	let proto = deepAssign({},evaluators,info);
	proto.base = proto;

	return function(userEvaluators,  optionTypes = {}, info= {}){

		proto = Object.create( proto ); 
		deepAssign( proto , userEvaluators, {optionTypes}, info );

		return function(cmdStr,rawEntries,argUmint){

			proto = Object.create( proto ); 
			deepAssign(proto,{cmdStr,rawEntries,argUmint});

			return function _Evaluator(  optionName = '', optionKind, ...values ){

				let contextObj = Object.create( proto );

				contextObj.values = values;
				contextObj.optionName = optionName;
				contextObj.optionKind = optionKind;

				let typeName = contextObj.optionTypes[optionName] || 'default';

				return contextObj[typeName]( ...values );
			}; 
		};
	}; 
})( typeEvaluators, {
	OPTIONKINDS,
	ArgUmint,
	_$test:{deepAssign,AndAlias,isObject}
});

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
	else if(typeof p0 === 'string'){ [cmdStr, config = {}] = [p0, p1];}
	else{ throw new TypeError( `parameters are of the wrong type` );}

	config = deepAssign( {}, defaultConfig, config ); 
	let { defaults, typed, types:userEvaluators, aliases }=config;

	let andAlias = AndAlias(aliases);

	//build a dictionary of option:type entries from the 
	//'typed' configuration data
	let optionTypes = keysOf(typed).reduce((tObj,type)=>{
	    let optsList = typed[type];
		 if(!Array.isArray(optsList)){optsList=[optsList];}

		 optsList.forEach(option=>{
			 tObj[option]=type;
			 andAlias(tObj,option);
		 });

		 return tObj;
	},{});

	Evaluator = Evaluator(  userEvaluators, optionTypes, {config,andAlias} );


	/**
	 *
	 * @param cmdStr
	 * @return {Object} dictionary of Name Value pairs.
	 */
	 function argUmint( cmdStr ){

		if( Array.isArray( cmdStr ) ){ cmdStr = cmdStr.join( '' );}

		if( !cmdStr ){return {_:null,__:null};}

		let rawEntries = cmdStrParser( cmdStr, config.stripQuotes );

		//expand flag clusters to individual flags entries...........
		keysOf( rawEntries )
			  .filter( key => rawEntries[key].type == OPTIONKINDS.flag && key.length > 1 )
			  .forEach( key =>{
				  [...key].forEach( flag => rawEntries[flag] = rawEntries[key] );
				  delete rawEntries[key];
			  } );

		Evaluator = Evaluator(cmdStr,rawEntries,argUmint);

		//evaluate the entries and build a dictionary of N,V pairs
		let dict = keysOf( rawEntries ).reduce( ( dictObj, option ) =>{
			let { values, type:optionKind } = rawEntries[option];

			dictObj[option] = Evaluator(  option, optionKind, ...values ); 
			andAlias(dictObj,option,false);//dont overwrite existing values

			return dictObj;
		}, {} );

		//apply defaults........................................
		keysOf( defaults ).forEach( key =>{
			if( !dict[key] ){
				dict[key] = defaults[key];
				andAlias(dict,key,false);
			}
		} );

		return dict;
	}

	return cmdStr? argUmint( cmdStr ): argUmint;

}

module.exports = ArgUmint;
