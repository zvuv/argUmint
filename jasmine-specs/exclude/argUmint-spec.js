'use strict';
/**
 *@module cmdStrParser-spec
 */
const setup = require( './../setup' ),
	  path = require( 'path' ),
	  fs = require( 'fs' ),
	  ArgUmint = require( setup.modulePath( 'ArgUmint' ) ),
	  keysOf = Object.keys
	  ;

function isObj( x ){
	return !(x instanceof String)
		  && !(x instanceof Function)
		  && Object( x ) === x
		  ;
}

/**
 * Duck type equality.  Fails if one is an array and the
 * the other not.  Otherwise it does no type checking.
 *
 */
function deepEqual( a, b ){

	if( Object.is( a, b ) ){return true;}

	if(
		  !isObj( a )
		  || !isObj( b )
		  || Array.isArray( a ) !== Array.isArray( b )
	){return false;}

	let keysOfA = keysOf( a );
	if( keysOfA.length !== keysOf( b ).length ){return false;}

	return keysOfA.every( key => deepEqual( a[key], b[key] ) );

}

function deepAssign( tgt, ...srcs ){

	function merge( tgt, src ){

		if( src === undefined ){
			throw new TypeError( 'src is undefined' );
		}

		if( Array.isArray( tgt ) !== Array.isArray( src ) ){
			throw new TypeError( 'src & tgt must both be arrays or objects' );
		}

		keysOf( src ).forEach( key =>{
			let prop = src[key];

			if( isObj( prop ) ){
				if( !(key in tgt) ){
					tgt[key] = Array.isArray( prop )? []: {};
				}
				merge( tgt[key], prop );
			}
			else{ tgt[key] = prop;}

		} );
	}

	srcs.forEach( src => merge( tgt, src ) );

	return tgt;
}

describe( 'ArgUmint Specs', () =>{
	describe( 'helper functions', () =>{

		let dict = ArgUmint( '--_$test', {
				  typed: { get_$test: '_$test' },
				  types: { get_$test(){ return this.proto()._$test; } }
			  } ),
			  _$test = dict._$test
			  ;

		describe( 'isObject', () =>{
			const isObject = _$test.isObject;

			it( 'should reject primitives', () =>{
				expect( isObject( undefined ) ).toEqual( false );
				expect( isObject( null ) ).toEqual( false );
				expect( isObject( 'abc' ) ).toEqual( false );
				expect( isObject( false ) ).toEqual( false );
				expect( isObject( 17 ) ).toEqual( false );
			} );

			it( 'should reject functions & Strings', () =>{
				expect( isObject( function(){} ) ).toEqual( false );
				expect( isObject( _ => _ ) ).toEqual( false );
				expect( isObject( String( 'abc' ) ) ).toEqual( false );

			} );

			it( 'should accept objects', () =>{
				expect( isObject( {} ) ).toEqual( true );
				expect( isObject( [] ) ).toEqual( true );
				expect( isObject( /^\s*$/ ) ).toEqual( true );
			} );

		} );

		describe( 'andAlias', () =>{
			let AndAlias = _$test.AndAlias,
				  andAlias = AndAlias( { a: 'hay', bee: 'b', see: 'c' } )
				  ;
			;
			it( 'should assign to aliases with overwriting', () =>{

				let aliased = { a: 'apple', b: 'honey', c: 'zee', see: 'sea' };

				keysOf( aliased ).forEach( key => andAlias( aliased, key ) );

				let expected = {
						  a: 'apple', b: 'honey', hay: 'apple', bee: 'honey',
						  c                                        : 'zee', see                            : 'zee'
					  },
					  isEqual = deepEqual( aliased, expected )
					  ;

				expect( isEqual ).toEqual( true );
			} );

			it( 'should assign to aliases without overwriting', () =>{

				let aliased = { a: 'apple', b: 'honey', c: 'zee', see: 'sea' };

				keysOf( aliased ).forEach( key => andAlias( aliased, key, false ) );

				let expected = {
						  a: 'apple', b: 'honey', hay: 'apple', bee: 'honey',
						  c                                        : 'zee', see                            : 'sea'
					  },
					  isEqual = deepEqual( aliased, expected )
					  ;

				expect( isEqual ).toEqual( true );
			} );
		} );

		describe( 'deepAssign', () =>{
			let deepAssign = _$test.deepAssign;

			it( 'should copy simple properties', () =>{
				let src = { a: 'apple', b: 'honey', c: 'zee', see: 'sea' },
					  tgt = deepAssign( {}, src );
				expect( deepEqual( tgt, src ) ).toEqual( true );
			} );

			it( 'should overwrite existing properties', () =>{
				let src = { a: 'apple', b: 'honey', c: 'zee', see: 'sea' },
					  tgt = deepAssign( { a: 'pear' }, src )
					  ;
				expect( deepEqual( tgt, src ) ).toEqual( true );
			} );

			it( 'should not copy from the prototype', () =>{
				let src = Object.create( { a: 'apple', b: 'honey', c: 'zee', see: 'sea' } ),
					  tgt = deepAssign( {}, src )
					  ;
				expect( keysOf( tgt ).length ).toEqual( 0 );
			} );

			it( 'should copy  properties recursively', () =>{
				let src = { o: { i: 'q', j: { jay: 'bird' } } },
					  tgt = deepAssign( {}, src )
					  ;
				expect( deepEqual( tgt, src ) ).toEqual( true );
				expect( Object.is( src.o, tgt.o ) ).toEqual( false );
			} );

			it( 'should copy arrays', () =>{
				let src = ['the', 'slings', 'and', 'arrows'],
					  tgt = deepAssign( [], src )
					  ;
				expect( deepEqual( tgt, src ) ).toEqual( true );
			} );

			it( 'should copy array properties', () =>{
				let src = { a: ['the', 'slings', 'and', 'arrows'] },
					  tgt = deepAssign( {}, src )
					  ;
				expect( deepEqual( tgt, src ) ).toEqual( true );
			} );

			it( 'should copy array properties containing objects and arrays', () =>{
				let src = { a: [[...'letters'], { a: 3.14159, b: 2.7182 }] },
					  tgt = deepAssign( {}, src )
					  ;
				expect( deepEqual( tgt, src ) ).toEqual( true );
			} );

			it( 'should copy function properties ', () =>{
				let src = { f: () => null, g(){} },
					  tgt = deepAssign( {}, src )
					  ;
				expect( deepEqual( tgt, src ) ).toEqual( true );
			} );

			it( 'should copy from multiple sources', () =>{
				let tgt = deepAssign( {}, { a: 1 }, { b: 2 }, { c: 3 } ),
					  expected = { a: 1, b: 2, c: 3 }
					  ;
				expect( deepEqual( tgt, expected ) ).toEqual( true );
			} );

			it( 'should copy and override from multiple sources', () =>{
				let tgt = deepAssign( {}, { a: 1 }, { a: 2 }, { a: 3 } ),
					  expected = { a: 3 }
					  ;
				expect( deepEqual( tgt, expected ) ).toEqual( true );
			} );

			it( 'should not copy objects onto arrays or vice versa ', () =>{
				expect( _ => deepAssign( {}, [] ) ).toThrow();
				expect( _ => deepAssign( [], {} ) ).toThrow();
			} );
		} );

		describe( 'configuration object.', () =>{

			function getProp( propName, cmdStr = '', config = {} ){

				let cfg = deepAssign( {}, {
					                      typed: { getProperty: 'prop' },
					                      types: { getProperty( prop ){ return this[prop];} }
				                      },
				                      config
					  ),
					  str = `--prop ${propName} ${cmdStr}`,
					  dict = ArgUmint( str, cfg )
					  ;

				return dict['prop'];
			}

			it( 'should set defaults', () =>{

				let config = getProp( 'config', { defaults: { a: 1, b: 2 } } ),
					  defaults = { a: 1, b: 2 },
					  result = getProp( 'config', '', { defaults } )
					  ;
				expect( deepEqual( defaults, result.defaults ) ).toEqual( true );
			} );

			it( 'should set aliases', () =>{

				let aliases = { a: 'b' },
					  result = getProp( 'config', '', { aliases } )
					  ;
				expect( deepEqual( aliases, result.aliases ) ).toEqual( true );
			} );

			it( 'should set option types', function(){

				let typed = { numeric: ['a', 'b'], boolean: 'c' },
					  result = getProp( 'config', '', { typed } )
					  ;

				expect( deepEqual( typed.numeric, result.typed.numeric ) ).toEqual( true );
				expect( typed.boolean ).toEqual( result.typed.boolean );

			} );

			it('should add type evaluators',()=>{
				let config ={types:{hi:function(){return 'hi';}}},
					  result = getProp( 'config', '-h', config )
				;

				expect(config.types.hi()).toEqual(result.types.hi());

			});

		} );

	} );
} );

