'use strict';

/**
 *@module test-spec
 */
const config = require( '../setup' ),
	  path = require( 'path' ),
	  fs = require( 'fs' ),
	  parser = require(config.modulePath('parser'))
	  ;

describe('Test Spec',()=>{
	it('should fail...'),()=>{
		expect(false).toBeTrue();
	}
});