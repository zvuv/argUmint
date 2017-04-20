

const argUmint=require('./argUmint'),
	   argV=process.argv.slice(2)
;


let dict = argUmint(argV.join(' '));
console.log(dict);