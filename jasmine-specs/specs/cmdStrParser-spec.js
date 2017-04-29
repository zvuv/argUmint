'use strict';

/**
 *@module regex-spec
 */
const config = require( './../setup' ),
	  path = require( 'path' ),
	  fs = require( 'fs' ),
	  cmdStrParser = require( config.modulePath( 'cmdStrParser' ) ),
	  { OPTIONTYPES } = cmdStrParser,
	  { Entries }=cmdStrParser._$test,
	  keysOf = Object.keys
	  ;

function isUnderscore( type ){
	return type == OPTIONTYPES.leading || type == OPTIONTYPES.trailing;
}

//.....................................................................
//extend Entries prototype for testing
//.....................................................................
const baseUpdate= Entries.prototype.update;

Entries.prototype.update=function ( option, type, ...values){
	values.forEach(value=>{
		baseUpdate.call(this,option,type,value);	 
	});
};

Entries.prototype.toString = function( testData ){
	let str = this._?this._.values.join( ' ' )+' ':'';

	str = keysOf( this )
		  .filter( key => !isUnderscore( key ) )
		  .reduce( ( str, key ) =>{
			  let valsStr = this[key].values.join( ' ' );
			  return str += ` ${this[key].type}${key} ${valsStr}`;
		  }, str );

	if(this.__){ str += ' -- '+ this.__.values.join( ' ' );}

	return str;
};

Entries.prototype.isEqual = function( target ){
	let keys = keysOf( this ).sort(),
		  len = keys.length,
		  tgtKeys = keysOf( target ).sort()
		  ;

	if( len !== tgtKeys.length ){
		throw new RangeError(`Number of keys does not match ${len} vs ${tgtKeys.length}`);
	}

	keys.every(key=>{
		let  entry = this[key],
			  tgtEntry = target[key]
			  ;

		if( !entry  ){
			throw new Error(`testData has no entry for key:${key}`);
		}
		if( !tgtEntry ){
			throw new Error(`target has no entry for key:${key}`);
		}
		if( entry.type !== tgtEntry.type ){
			throw new Error(`Entry types do not match. key:${key} ${entry.type} ${tgtEntry.type}`);
		}

		let values = entry.values,
			  vLen = values.length,
			  tgtValues = tgtEntry.values
			  ;

		if( vLen !== tgtValues.length ){			
			throw new Error(`key:${key} value arrays of different lengths  ${vLen} ${tgtValues.length}`);
		}

		let valsMatch = values.every((value,i)=>{
			if( value!== tgtValues[i] ){			
				throw new Error(`key:${key} values at index ${i} does not match ${value} ${tgtValues[i]}`);
			}
		});

		if(!valsMatch){return false;}
	});

	return true;

};

//.....................................................................
//specs
//.....................................................................
describe( 'Parser', () =>{

	it( 'should parse all options and values including leading and trailing', () =>{

		const testData = new Entries();

		testData.update( '_', OPTIONTYPES.leading, ...['one', 'two', 'three', '-21'] );
		testData.update( '__', OPTIONTYPES.trailing, ...['--dog', 'rat', 'horse']);
		testData.update( 'abc', OPTIONTYPES.option , ...['apples', 'pears', 'ba-na--na']);
		testData.update( 'x', OPTIONTYPES.flag );

		let testStr = testData.toString(),
			  dict = cmdStrParser( testStr )
			  ; 
		expect( testData.isEqual(dict) ).toBeTruthy();

	} );

	it( 'should parse all options and values without leading but with trailing', () =>{

		const testData = new Entries();

		//testData.update( '_',  OPTIONTYPIES.leading, ...['one', 'two', 'three', '-21'] );
		testData.update( '__', OPTIONTYPES.trailing, ...['--dog', 'rat', 'horse']);
		testData.update( 'abc', OPTIONTYPES.option , ...['apples', 'pears', 'ba-na--na']);
		testData.update( 'x', OPTIONTYPES.flag );

		let testStr = testData.toString(),
			  dict = cmdStrParser( testStr )
			  ; 
		expect( testData.isEqual(dict) ).toBeTruthy();

	} );

	it( 'should parse all options and values with a leading but no trailing', () =>{

		const testData = new Entries();

		testData.update( '_', OPTIONTYPES.leading, ...['one', 'two', 'three', '-21'] );
		//testData.update( '__',  OPTIONTYPIES.trailing, ...['--dog', 'rat', 'horse']);
		testData.update( 'abc', OPTIONTYPES.option , ...['apples', 'pears', 'ba-na--na']);
		testData.update( 'x', OPTIONTYPES.flag );

		let testStr = testData.toString(),
			  dict = cmdStrParser( testStr )
			  ; 
		expect( testData.isEqual(dict) ).toBeTruthy();

	} );
	it( 'should parse all  leading & trailing values without options', () =>{

		const testData = new Entries();

		testData.update( '_', OPTIONTYPES.leading, ...['one', 'two', 'three', '-21'] );
		testData.update( '__', OPTIONTYPES.trailing, ...['--dog', 'rat', 'horse']);
	//	testData.update( 'abc', OPTIONTYPIES.option , ...['apples', 'pears', 'ba-na--na']);
//		testData.update( 'x', OPTIONTYPIES.flag );

		let testStr = testData.toString(),
			  dict = cmdStrParser( testStr )
			  ; 
		expect( testData.isEqual(dict) ).toBeTruthy();

	} );

	it( 'should parse leading values only', () =>{

		const testData = new Entries();

		testData.update( '_', OPTIONTYPES.leading, ...['one', 'two', 'three', '-21'] );

		let testStr = testData.toString(),
			  dict = cmdStrParser( testStr )
			  ; 
		expect( testData.isEqual(dict) ).toBeTruthy();

	} );

	it( 'should trailing values only ', () =>{

		const testData = new Entries();

		testData.update( '__', OPTIONTYPES.trailing, ...['--dog', 'rat', 'horse']);

		let testStr = testData.toString(),
			  dict = cmdStrParser( testStr )
			  ; 
		expect( testData.isEqual(dict) ).toBeTruthy();

	} );


	it( 'should parse all options and values only', () =>{

		const testData = new Entries();

		testData.update( 'abc', OPTIONTYPES.option , ...['apples', 'pears', 'ba-na--na']);
		testData.update( 'x', OPTIONTYPES.flag );

		let testStr = testData.toString(),
			  dict = cmdStrParser( testStr )
			  ; 
		expect( testData.isEqual(dict) ).toBeTruthy();

	} );

	it( 'should accumulate multiple assignments to the same option', () =>{

		const testData = new Entries();

		testData.update( 'fruit', OPTIONTYPES.option , ...['apples', 'pears', 'ba-na--na']);
		testData.update( 'x', OPTIONTYPES.flag );
		testData.update( 'fruit', OPTIONTYPES.option , ...['melon', 'grapes']); 
		testData.update( 'x', OPTIONTYPES.flag ,'eggs');
		let testStr = testData.toString(),
			  dict = cmdStrParser( testStr )
			  ; 
		expect( testData.isEqual(dict) ).toBeTruthy();


		expect(dict.x.values[0]).toEqual('eggs');

		let  fruits = dict.fruit.values,
			  isFruit = [ 'apples', 'pears', 'ba-na--na', 'melon', 'grapes' ].every(f=>fruits.includes(f));

		expect(isFruit).toBeTruthy();




	} );

} );


