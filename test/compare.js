'use strict';
module.exports = function compare ({ normalize, parsed, stringified, expect }) {
	
	// test *.parse
	try {
		JSON.stringify(parsed)===JSON.stringify(expect);
	}
	catch (e) {
		console.log('*.parse:');
		throw JSON.stringify(parsed, null, '\t');
	}
	
	// test *.stringify
	if ( stringified!==normalize ) {
		if ( stringified.length!==normalize.length ) {
			console.log('*.stringify: stringified.length==='+stringified.length+', normalize.length==='+normalize.length);
		}
		let ri = 0;
		const l = Math.min(stringified.length, normalize.length);
		for ( let i = 0; i<l; ++i ) {
			if ( stringified[i]!==normalize[i] ) {
				console.log('*.stringify: stringified['+i+']==="'+escape(stringified[i])+'", normalize['+i+']==="'+escape(normalize[i])+'"');
				const lines = stringified.split('\n');
				lines[ri] = lines[ri]+'【这一行】';
				console.log(lines.join('\n'));
				break;
			}
			if ( normalize[i]==='\n' ) { ++ri; }
		}
		throw '';
	}
	
};