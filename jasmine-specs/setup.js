/**
 * Created by Adam on 1/29/2017.
 */

const Jasmine = require( 'jasmine' ),
	  path = require( 'path' ),
	  jasmineConfig = require( './jasmine.json' )
	  ;

let jasmine = new Jasmine();
jasmine.loadConfig( jasmineConfig );

jasmine.onComplete( function( passed ){
	if( passed ){
		console.log( 'Success' );
	}
	else{
		console.error( "Failed" );
	}
} );

module.exports = {
	projDir: jasmineConfig.project_dir,
	dataDir: jasmineConfig.data_dir,
	modulePath( file ){ return path.join( this.projDir, file ); }
};

jasmine.execute();