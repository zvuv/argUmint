'use strict';

/**
 *@module config-merge
 */

const keysOf = Object.keys;

function isString( obj ){
	return toString.call( obj ) == '[object String]';
}

function isObject( x ){
	return !(x instanceof String) 
	&& !(x instanceof Function) 
	&& Object( x ) === x;
}


function mergeObjs(...srcs){
	let tgt={};

	function merge(tgt,src){
		keysOf(src).forEach(key=>{
			let prop = src[key];

			if(Array.isArray(prop)){
			}
			else if(isObject(prop)){
				let dest = tgt[key] ||(tgt[key]={});
				merge(dest,prop);
			}
			else { tgt[key]=prop;}
		});
	}
	
	srcs.forEach(src=>merge(tgt,src));
	return tgt;
};

function cloneObj(o){return mergeObjs(o);}

module.exports={
	mergeObjs,
	cloneObj,
	keysOf,
	isObject,
	isString
};
