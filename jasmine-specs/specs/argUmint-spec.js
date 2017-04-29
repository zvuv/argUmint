'use strict';
/**
 *@module cmdStrParser-spec
 */
const config = require( './../setup' ),
	  path = require( 'path' ),
	  fs = require( 'fs' ),
	  ArgUmint = require( config.modulePath( 'ArgUmint' ) ),
	  keysOf = Object.keys
	  ;

function isObj( x ){
	return !(x instanceof String)
		  && !(x instanceof Function)
		  && Object( x ) === x
		  ;
}


function deepEqual( a, b ){

	if(Object.is(a,b)){return true;}

	if(
		!isObj(a) 
		|| !isObj(b)
		|| Array.isArray( a ) !== Array.isArray( b )
	){return false;}

	let keysOfA = keysOf( a );
	if( keysOfA.length !== keysOf( b ).length ){return false;}

	return keysOfA.every( key => deepEqual( a[key], b[key] ) ); 

}

function deepAssign( tgt, ...srcs ){

	function merge( tgt, src ){
		keysOf( src ).forEach( key =>{
			let prop = src[key];

			if( isObject( prop ) ){
				if(!(key in tgt)){
					tgt[key]=Array.isArray(prop)?[]:{};
				}
				merge( tgt[key] , prop );
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

		describe('andAlias',()=>{
			let AndAlias=_$test.AndAlias;

			it('should assign to aliases',()=>{
				let andAlias = AndAlias({a:'hay',bee:'b',see:'c'}),
					aliased ={a:'apple',b:'honey',c:'zee', see:'sea'}
					;

					keysOf(aliased).forEach(key=>andAlias(aliased,key));

					let expected = {
						a:'apple',b:'honey',hay:'apple',bee:'honey', 
						c:'zee',see:'zee'
					},
					isEqual = deepEqual(aliased,expected) 
					;

				expect(isEqual).toEqual(true); 
			});
		});
	} );
} );
