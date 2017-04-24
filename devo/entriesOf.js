'use strict';

/**
 *@module entriesOf
 */
function entriesOf( obj, callback = _ => _ ){
	Object.keys( obj ).forEach( k => callBack( k, obj[k] ) );
}