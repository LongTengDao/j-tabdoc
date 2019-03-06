'use strict';

require('../test/test.js')(async ({ build, get, map }) => {
	
	await build({
		name: 'j-tabdoc',
		Name: 'jTabDoc',
		Desc: `
			TabDoc 的官方标准实现。从属于“简计划”。
			The official standard implementation of TabDoc. Belong to "Plan J".`,
		semver: await get('src/version'),
		ES: 3,
		ESM: true,
		NPM: {
			meta_: {
				description: 'The official standard implementation of TabDoc. Belong to "Plan J".／TabDoc 的官方标准实现。从属于“简计划”。',
				keywords: ['TabDoc'],
			},
		},
		UMD: true,
		DOC: true,
	});
	
	await map('src/d.ts', 'dist/TSD/j-tabdoc.d.ts');
	
});
