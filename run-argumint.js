'use strict';

/**
 *@module run-parser
 */

const argUmint = require( './argUmint') ;

let cmdStr =
	  `two roads diverged -srq 1 --fruit apples =pear ba-na--na "elephant pants" -x  --abc  -1.0 -- earth air fire water`;

let config={
	aliases:{abc:'xyz',f:'file'},
	defaults:{t:17, file:'readme.txt'},
	typed:{xyz:'numeric',q:'boolean'}
};
let result= argUmint( cmdStr, config);

console.log(result);
