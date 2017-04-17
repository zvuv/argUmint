'use strict';

/**
 *@module parser
 */
const optRgx=/--/gi,
	  valRgx=/ /gi
;

function regexExp(str,rgx,callback){
	if( !rgx.global ){ rgx = new RegExp( rgx, rgx.flags+'g' );}

	let match;
	while((match=rgx.exec(str))!==null){
		if(match.index===rgx.lastIndex){ rgx.lastIndex++;}
		else{ callback(match);}
	}
}

function parse(cmdStr){
	let entries={};

	regexExec(cmdStr,optRgx, match=>{
		let [,type,option,valueStr]=match;
		entries[option]={type,valueStr};
	});

	return entries;
}


module.exports = parse;