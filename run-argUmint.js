'use strict';

/**
 *@module run-zargs
 */

const argU = require( './argUmint' );

let config = {
	defaults: { u: 'you', x: 'ham' },
	aliases : { a: 'aardvark', f: 'file', x: 'eggs' },
	typed   : {
		numz: 'numArray',
		age : 'numeric',
		a   : 'boolean',
		dict: 'json',
		list: 'json',
		dt  : 'date'
	},
	types   : {
		numArray( values ){
			return values.map( val => Number( val ) );
		},

		date( values ){
			let dateStr = values.join( ' ' );
			return new Date( dateStr )
				  .toJSON()
				  .slice(0,10)
				  .replace(/-/g,'/')
				  ;
		}

	},
};

// let cmdStr = String.raw`-rst  --fruit apple`;
// let cmdStr = String.raw`one two -7 debug-brk -rst  --fruit apple  __ last words`;
// let cmdStr = String.raw` apple pear --f abc.txt --xyz yz -rst  __ last words`;
//let cmdStr = String.raw`first -abc "yes" --file coriander\stuff.txt --numz -1 39  -xyz salang -rst __ final`;
let cmdStr = ` abc  ships shoes sealing wax --dt jul 1 1998 --dict {a:3,b:true,'see':"bananas"} -f "a/b/c. txt" `
			 +`--age 30 --list=['a','b','c'] --numz  1  2 3 5.78e6  -abc`
	  +` --  dog  -horse  --rat`
	  ;
let dict = argU( cmdStr,config );
console.log(dict);

// Object.keys(result).forEach(key=>{
// 	let entry = result[key];
// 	let valStr = entry.values.reduce((s, val)=> s+= val.toString(),'');
// 	let outStr= `${key}: type:${entry.type} values:${valStr}`;
// 	console.log(outStr);
// });

let x = 1;
