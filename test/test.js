'use strict';

module.exports = require('@ltd/j-dev')(__dirname+'/..')(async ({ import_default }) => {
	
	const jTabDoc = await import_default('src/default');
	
	const parsed = jTabDoc.parse(require('./sample'), Reviver(jTabDoc));
	const space = jTabDoc.Space(2, 1);
	const stringified = jTabDoc.stringify(parsed, Replacer(jTabDoc, space), space).join('\n');
	
	require('./compare')({
		normalize: require('./normalize'),
		parsed: parsed,
		stringified: stringified,
		expect: require('./expect'),
	});
	
});

function Reviver (jTabDoc) {
	let reviver;
	return reviver = {
		group: [
			[/^\n\t\n/, (group) => ( {
				nodeName: 'Section',
				nodeValue: group[0].value,
				childNodes: jTabDoc.parse(group[1].value, reviver, group[1].number)
			} )],
			[/^\n/, (group) => ( { nodeName: 'P', nodeValue: group.value } )],
			[/^\t\n/, (group) => ( {
				nodeName: 'Section',
				nodeValue: null,
				childNodes: jTabDoc.parse(group.value, reviver, group.number)
			} )],
			[/^\|\t\n/, (group) => ( { nodeName: 'Table', nodeValue: group.value } )],
		]
	};
}

function Replacer (jTabDoc, space) {
	return function replacer (nodeList) {
		const level = [];
		for ( const node of nodeList ) {
			if ( typeof node==='number' ) { level.push(node); }
			else {
				switch ( node.nodeName ) {
					case 'P':
						level.push({ key: '', value: node.nodeValue });
						break;
					case 'Section':
						node.nodeValue===null ?
							level.push({ key: '\t', value: jTabDoc.stringify(node.childNodes, replacer, space) }) :
							level.push(
								{ key: '', value: node.nodeValue },
								{ key: '\t', value: jTabDoc.stringify(node.childNodes, replacer, space) },
							);
						break;
					case 'Table':
						level.push({ key: '|\t', value: node.nodeValue });
						break;
				}
			}
		}
		return level;
	};
}
