'use strict';

/**
 *@module run-zargs
 */

const argU = require( './argU' );

let config = {
	defaults: { u: 'you', x: 'ham' },
	aliases : { a: 'aardvark', f: 'file', x: 'eggs' },
	typed   : {
		//numz: 'numArray',
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
			return new Date( dateStr );
		}

	},
};

// let cmdStr = String.raw`-rst  --fruit apple`;
// let cmdStr = String.raw`one two -7 debug-brk -rst  --fruit apple  __ last words`;
// let cmdStr = String.raw` apple pear --f abc.txt --xyz yz -rst  __ last words`;
//let cmdStr = String.raw`first -abc "yes" --file coriander\stuff.txt --numz -1 39  -xyz salang -rst __ final`;
let cmdStr = `  dog rat horse --dt jul 1 1998 --dict {a:3,b:true,'see':"bananas"} -f "a/b/c. txt" `
			 +`--age 30 --list=['a','b','c'] --numz  1  2 3 5.78e6 `
	  +` __ why should a dog a horse a rat have life and thou no breath at all?  --xyz`
	  ;
let result = argU( cmdStr,config );
console.log( result );

let x = 1;