'use strict';

/**
 *@module argUmint
 */

const cmdStrParser = require( './cmdStrParser' ), 
		typeEvaluators = require( './evaluators' ),
		{ isObject, entriesOf, deepAssign, AndAlias } = require('./argUtilities'),

		//Using the word 'optionType' for a different purpose 
		//here, so we will call these optionKinds
		OPTIONKINDS = cmdStrParser.OPTIONTYPES
		;


/**
 * evaluator functions are invoked bound to a context object
 * that holds instance information about the entry and whose 
 * prototype exposes the evaluator function.
 *
 * The factory method builds the prototype and returns the
 * Evaluator function which creates context objects and
 * uses them to invoke the required evaluator and returns
 * the result.
 */

let EvaluatorFactory = (function(evaluators,OPTIONKINDS){

	const baseProto = deepAssign({},evaluators, {OPTIONKINDS});
	baseProto.base=baseProto;

	return function _EvaluatorFactory(userEvaluators,optionTypes){

		const proto = Object.create(baseProto);
		deepAssign(proto,userEvaluators,{optionTypes});

		return function _Evaluator(  optionName = '', optionKind, values ){

			const contextObj = Object.create( proto );
			deepAssign(contextObj,{optionName,optionKind,values});

			//index to the required evaluator function and invoke it.
			const typeName = contextObj.optionTypes[optionName] || 'default'; 
			return contextObj[typeName]( ...values );
		} ;

	};

} )(typeEvaluators,OPTIONKINDS);

// will hold copies of a  number of internal objects for testing....
const _$test={};

//default config object..................................
const defaultConfig = {
	stripQuotes: true,
	expandFlags: true,
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

	// let UserProto = ConfigProto(  userEvaluators, optionTypes, {config,andAlias} );
	const Evaluator = EvaluatorFactory(userEvaluators, optionTypes);

	deepAssign(_$test,{config,optionTypes});

	/**
	 *
	 * @param cmdStr
	 * @return {Object} dictionary of Name Value pairs.
	 */
	 function argUmint( cmdStr ){

		if( Array.isArray( cmdStr ) ){ cmdStr = cmdStr.join( '' );}

		if( !cmdStr ){return {_:null,__:null};}

		const {stripQuotes,expandFlags}=config; 
		let parsedOptions = cmdStrParser( cmdStr, {stripQuotes,expandFlags});


		//evaluate the entries and build a dictionary of N,V pairs
		// let dict = keysOf( rawEntries ).reduce( ( dictObj, option ) =>{
		let dict = entriesOf(parsedOptions).reduce((dictObj,entry)=>{
			let {key:option,value:entryData} = entry;
			let { values, type:optionKind } = entryData;

			dictObj[option] = Evaluator(  option, optionKind, values ); 
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
module.exports._$test = _$test;

// let ConfigProto = (function _BaseProto( evaluators, info ){

// 	let proto = deepAssign({},evaluators,info);
// 	proto.base = proto;

// 	return function _ConfigProto(userEvaluators,  optionTypes = {}, info= {}){

// 		proto = Object.create( proto ); 
// 		deepAssign( proto , userEvaluators, {optionTypes}, info );

// 		return function _UserProto(cmdStr,rawEntries,argUmint){

// 			proto = Object.create( proto ); 
// 			deepAssign(proto,{cmdStr,rawEntries,argUmint});

// 			return function _Evaluator(  optionName = '', optionKind, ...values ){

// 				let contextObj = Object.create( proto );

// 				contextObj.values = values;
// 				contextObj.optionName = optionName;
// 				contextObj.optionKind = optionKind;

// 				let typeName = contextObj.optionTypes[optionName] || 'default';

// 				return contextObj[typeName]( ...values );
// 			}; 
// 		};
// 	}; 
// })( typeEvaluators, {
// 	OPTIONKINDS,
// 	ArgUmint,
// 	_$test:{deepAssign,AndAlias}
// });
