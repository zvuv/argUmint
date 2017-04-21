'use strict';

/**
 *@module test-spec
 */
const config = require( '../setup' ),
	  path = require( 'path' ),
	  fs = require( 'fs' ),
	  parser = require(config.modulePath('parser')),
	  {patterns,regexExec}=parser.$test

	  ;

describe('Patterns',()=>{

	xdescribe('optionValues should match a list of option values',()=>{
		const testStr='   --abc  apples pears bananas  -17 ba-na--na --  lion tiger bear',
		regex = new RegExp(patterns.optVals,'i'),
		matches = testStr.match(regex)
		;

		it('should match a list of values embedded in a string',()=>{
			expect(matches.length).toEqual(2);
			expect(matches[1]).toEqual('apples pears bananas  -17 ba-na--na');
		});
	});

	describe('leading values',()=>{

		it('should find the leading values ',()=>{
			const testStr='one two three -21 --abc  apples pears ba-na--na --num-z 1 2 3',
			regex=new RegExp(patterns.leadVals,'i'),
			[,match]=testStr.match(regex)
			;
			expect(match).toEqual('one two three -21');
		});

		it('should find the leading values with a leading space ',()=>{
			const testStr=' one two three -21 --abc  apples pears ba-na--na --num-z 1 2 3',
				  regex=new RegExp(patterns.leadVals,'i'),
				  [,match]=testStr.match(regex)
				  ;
			expect(match).toEqual('one two three -21');
		});

		it('should find the leading values when followed by trailing values',()=>{
			const testStr=' one two three -21 --abc  apples pears ba-na--na -- dog rat horse',
				  regex=new RegExp(patterns.leadVals,'i'),
				  [,match]=testStr.match(regex)
				  ;
			expect(match).toEqual('one two three -21');
		});

		it('should find the leading values when there are no options',()=>{
			const testStr=' one two three -21 --abc  apples pears ba-na--na ',
				  regex=new RegExp(patterns.leadVals,'i'),
				  [,match]=testStr.match(regex)
				  ;
			expect(match).toEqual('one two three -21');
		});
	});

	describe('trailing values',()=>{

		const regex=new RegExp(patterns.trailingVals,'i');

		it('should find trailing values',()=>{
			const testStr=' one two three -21 --abc  apples pears ba-na--na -- --dog rat horse', 
			[,match]=testStr.match(regex)
			;
			expect(match).toEqual('--dog rat horse');

		});

		it('should find trailing values with no leading options ',()=>{
			const testStr=' one two three -21 -- --dog rat horse', 
			[,match]=testStr.match(regex)
			;
			expect(match).toEqual('--dog rat horse');

		});

		it('should find trailing values with no leading options or values ',()=>{
			const testStr='-- --dog rat horse', 
			[,match]=testStr.match(regex)
			;
			expect(match).toEqual('--dog rat horse');

		});
	});
   
	describe('options with values section',()=>{ 
		const regex=new RegExp(patterns.optVals,'i');

		it('should find the options & values ',()=>{ 
			const testStr=' one two -12 --abc pears ba-na--na -xyz --num=24 -- --dog rat horse', 
			[,optsValsStr] = testStr.match(regex)
			;
			expect(optsValsStr).toEqual('--abc pears ba-na--na -xyz --num=24');
		});

		it('should find the options & values with no leading values ',()=>{ 
			const testStr=' --abc pears ba-na--na -xyz --num=24 -- --dog rat horse', 
			[,optsValsStr] = testStr.match(regex)
			;
			expect(optsValsStr).toEqual('--abc pears ba-na--na -xyz --num=24');
		});

		it('should find the options & values with no leading values or space',()=>{ 
			const testStr='--abc pears ba-na--na -xyz --num=24 -- --dog rat horse', 
			[,optsValsStr] = testStr.match(regex)
			;
			expect(optsValsStr).toEqual('--abc pears ba-na--na -xyz --num=24');
		});
	});

	describe('cmdStr',()=>{
		const regex=new RegExp(patterns.cmdStr,'i');

		it('should parse the cmd string into its three parts ',()=>{
			const testStr=' one two -12 --abc pears ba-na--na -xyz --num=24 -- --dog rat horse', 
			[,leader,optValsStr,trailer]=testStr.match(regex);
			;

			expect(leader).toEqual('one two -12');
			expect(optValsStr).toEqual('--abc pears ba-na--na -xyz --num=24');
			expect(trailer).toEqual('--dog rat horse');

		});

		it('should get just optvals and traileer',function(){

			const testStr=' --abc pears ba-na--na -xyz --num=24 -- --dog rat horse',
				  [,leader,optValsStr,trailer]=testStr.match(regex);
			;
			expect(leader).not.toBeDefined();
			expect(optValsStr).toEqual('--abc pears ba-na--na -xyz --num=24');
			expect(trailer).toEqual('--dog rat horse');
		});

		it('should get just the leader and the opts values ',()=>{
			const testStr=' one two -12 --abc pears ba-na--na -xyz --num=24 ', 
			[,leader,optValsStr,trailer]=testStr.match(regex);
			;

			expect(leader).toEqual('one two -12');
			expect(optValsStr).toEqual('--abc pears ba-na--na -xyz --num=24');
			expect(trailer).not.toBeDefined();

		});

		it('should get just the leader and the trailer',()=>{
			const testStr=' one two -12  -- --dog rat horse', 
			[,leader,optValsStr,trailer]=testStr.match(regex);
			;

			expect(leader).toEqual('one two -12');
			expect(optValsStr).not.toBeDefined();
			expect(trailer).toEqual('--dog rat horse');

		});

		it('should get just the leader ',()=>{
			const testStr=' one two -12 ', 
			[,leader,optValsStr,trailer]=testStr.match(regex);
			;

			expect(leader).toEqual('one two -12');
			expect(optValsStr).not.toBeDefined();
			expect(trailer).not.toBeDefined();

		});

		it('should get just the opts values ',()=>{
			const testStr=' --abc pears ba-na--na -xyz --num=24 ', 
			[,leader,optValsStr,trailer]=testStr.match(regex);
			;

			expect(leader).not.toBeDefined();
			expect(optValsStr).toEqual('--abc pears ba-na--na -xyz --num=24');
			expect(trailer).not.toBeDefined();

		});

		it('should get just the trailer',()=>{
			const testStr=' -- --dog rat horse', 
			[,leader,optValsStr,trailer]=testStr.match(regex);
			;

			expect(leader).not.toBeDefined();
			expect(optValsStr).not.toBeDefined();
			expect(trailer).toEqual('--dog rat horse');

		});

	});

	describe('option should pick options out of a string of options & values',()=>{
		const testStr='one two three --abc  apples pears bananas  -17 ba-na--na --num-z   -xyz ',
				regex=new RegExp(patterns.option,'gi'),
				optionsList=[]
				;

				regexExec(testStr,regex,match=>{
					let [,leader,name]=match;
					optionsList.push([leader,name]);
				});

		it('should find all the options',()=>{
				expect(optionsList.length).toEqual(3);
		});
		
		it('should match each option',()=>{
			let options = ['--abc','--num-z','-xyz'],
			isMatch=optionsList.every((match,i)=> match.join('')===options[i]);  
			expect(isMatch).toBeTruthy(); 
		});	
	});

});
