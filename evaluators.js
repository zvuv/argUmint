'use strict';

/**
 *@module typeEvaluators
 */


const noop = ( ...values ) => values;

module.exports = {

	noop: noop,

	default( ...values ){

		switch(values.length) {

			case 0:
				return true;
				break;

			case 1:
				return values[0];
				break;

			default:
				return values;

		}
	},

	string( ...values ){
		if( !values.length ){return;}
		return values.join( ' ' );
	},

	boolean( value ){

		switch(value) {
			// no value supplied defaults to true!
		   case undefined:
			case null:
			case '':
				return true;
			case 'false':
			case 'no':
			case 'n':
			case '0':
				return false;
			default:
				 return Boolean( value );
		}

	},

	numeric( value){ 

		return Number( value);
	},

	json( ...values ){
		if( !values.length ){return;}

		let str = values
			  .join( '' )
			  .trim()
			  //wrap field names in quotes...............
			  .replace( /([{,])\s*([a-z_$][\w\_\$]*)\s*:/gi, '$1 "$2":' )
			  //replace single with double quotes
			  .replace( /([{\[:,]\s*)('([^']+)')/gi, '$1"$3"' )
			  ;

		return JSON.parse( str );
	},

	attributes: noop,

	proto(){
		return Object.getPrototypeOf( this );
	}
};


