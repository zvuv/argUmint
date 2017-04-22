'use strict';

/**
 *@module run-parser
 */
const parser = require( './../parser' );

let cmdStr = 'one two three -x --abc'
			 +'  apples pears -17 ba-na--na "e e" '
			 +' -- --dog rat -horse'
	  ;


let table= parser(cmdStr);

console.log(table);