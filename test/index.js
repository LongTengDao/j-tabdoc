'use strict';

const compare = require('./compare');

const sample = require('./sample');
const normalize = require('./normalize');
const expect = require('./expect');

module.exports = require('@ltd/j-dev').
	
	import_default(__dirname+'/../src/default.js').
	
	then(jTabDoc => {
		
		let parsed;
		let reviver;
		
		const space = jTabDoc.Space(2, 1);
		
		compare({
			
			normalize,
			
			parsed: parsed = jTabDoc.parse(sample, reviver = {
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
			}),
			
			stringified: jTabDoc.stringify(parsed, function replacer (nodeList) {
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
			}, space).join('\n'),
			
			expect,
			
		});
		
	});

module.exports.catch(console.error);
