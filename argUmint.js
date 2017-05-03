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

function entriesOf(obj){
	return keysOf(obj).map((key,i)=>({key,value:obj[key],i}));
}

function isObject( x ){
	return !(x instanceof String)
		  && !(x instanceof Function)
		  && Object( x ) === x
		  ;
}

/**
 * Deep merge of a sequence of objects 
 * Recursive merge of own enumerable properties
 * Properties are overwritten from right to left
 * Duck Type assignment.  Other than matching arrays
 * to arrays, the function does not pay attention
 * to types.
 */
function deepAssign( tgt, ...srcs ){

	function merge( tgt, src ){
		if(src === undefined){
			throw new TypeError('src is undefined');
		}

		if( Array.isArray(tgt) !== Array.isArray(src) ){
			throw new TypeError('src & tgt must both be arrays or objects');
		}

		entriesOf(src).forEach( ({key,value:prop})=>{	

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

function AndAliases(aliases){

	entriesOf(aliases).forEach( ({key,value})=>alias[value=key]);

	return function _andAliases(tgt,overwrite = true){

		entriesOf(aliases)
		.filter(({key:option,value})=> key in tgt && (overwrite || !(alias in tgt) ))
		.forEach(({key:option,value:alias})=> tgt[alias]=tgt[option] )
		;

		return tgt;
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
let ConfigProto = (function _BaseProto( evaluators, info ){

	let proto = deepAssign({},evaluators,info);
	proto.base = proto;

	return function _ConfigProto(userEvaluators,  optionTypes = {}, info= {}){

		proto = Object.create( proto ); 
		deepAssign( proto , userEvaluators, {optionTypes}, info );

		return function _UserProto(cmdStr,rawEntries,argUmint){

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
	var { defaults, typed, types:userEvaluators, aliases }=config;

	let andAlias = AndAlias(deepAssign({},aliases));

	let optionTypes = entriesOf(typed)
		.reduce( (tObj,entry)=> {
			 let {key:type,value:optsList}=entry;
			 //let optsList = typed[type];
			 if(!Array.isArray(optsList)){optsList=[optsList];}

			 optsList.forEach(option=>{
				 tObj[option]=type;
				 andAlias(tObj,option);
			 });

		 return tObj;
		},{});

	let UserProto = ConfigProto(  userEvaluators, optionTypes, {config,andAlias} );

	/**
	 *
	 * @param cmdStr
	 * @return {Object} dictionary of Name Value pairs.
	 */
	 function argUmint( cmdStr ){

		if( Array.isArray( cmdStr ) ){ cmdStr = cmdStr.join( '' );}

		if( !cmdStr ){return {_:null,__:null};}

		let parsedOptions = cmdStrParser( cmdStr, config.stripQuotes );

		//expand flag clusters to individual flags entries...........
	  	   entriesOf(parsedOptions)
			  .filter(({key,value})=>value.type == OPTIONKINDS.flag && key.length>1 )
			  .forEach( ({key,value}) =>{
				  [...key].forEach( flag => parsedOptions[flag] = value );
				  delete parsedOptions[key];
			  } );

		let Evaluator = UserProto(cmdStr,parsedOptions,argUmint);

		//evaluate the entries and build a dictionary of N,V pairs
		// let dict = keysOf( rawEntries ).reduce( ( dictObj, option ) =>{
		let dict = entriesOf(parsedOptions).reduce((dictObj,entry)=>{
			let {key:option,value:entryData} = entry;
			let { values, type:optionKind } = entryData;

			dictObj[option] = Evaluator(  option, optionKind, ...values ); 
			andAlias(dictObj,option,false);//dont overwrite existing values

			return dictObj;
		}, {} );

		//apply defaults........................................
		// keysOf( defaults ).forEach( key =>{
		entriesOf(defaults)
			.filter( ({key,value}) => !(key in dict))
			.forEach(({key,value})=>{
					dict[key] = value;
					andAlias(dict,key,false);
			} );

		return dict;
	}

	return cmdStr? argUmint( cmdStr ): argUmint;

}

module.exports = ArgUmint;
