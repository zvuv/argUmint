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

	boolean( ...values ){

		if( values.length ){
			let str = values[0].trim().toLowerCase(),
				  retVal
				  ;

			switch(str) {
				case 'false':
				case 'no':
				case 'n':
				case '0':
				case null:
					retVal = false;
				default:
					retVal = Boolean( str );
			}

			return retVal;
		}
		return true;
	},

	numeric( ...values ){

		if( !values.length ){return;}

		return Number( values[0].trim() );
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

