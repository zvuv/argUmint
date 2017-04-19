'use strict';

/**
*@module typeEvaluators
*/


const noop = val=>val;

module.exports= {

	noop :noop,

	default( values, info){

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

	string( values, info){
		if( !values.length ){return;}
		return values.join( ' ' );
	},

	boolean( values, info){

		if( values.length ){
			let [str]=values, retVal;

			switch(str.toLowerCase().trim()) {
				case "false":
				case "no":
				case "0":
				case null:
					retVal = false;
				default:
					retVal = Boolean( str );
			}

			return retVal;
		}
		return true;
	},

	numeric( values, info){

		if( !values.length ){return;}

		let [str]=values;
		return Number( str.trim() );
	},

	json( values, info){
		if( !values.length ){return;}

		let str = values.join( '' )
		.trim()
		//wrap field names in quotes...............
		.replace( /([{,])\s*([a-z_$][\w\_\$]*)\s*:/gi, '$1 "$2":' )
			//replace single with double quotes
			.replace( /([{\[:,]\s*)('([^']+)')/gi, '$1"$3"' )
				;

				return JSON.parse( str );
	},

	attributes:noop
};


