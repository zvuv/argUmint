'use strict';

/**
 *@module run-parser
 */

const parser = require('/parser');

let cmdStr=``;
let results = parser(cmdStr);

console.log(results);
