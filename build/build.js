'use strict';

require('../test/test.js')(async ({ build, read }) => {

	await build({
		name: 'j-tabdoc',
		Name: 'jTabDoc',
		Desc: `
			TabDoc 的官方标准实现。从属于“简计划”。
			The official standard implementation of TabDoc. Belong to "Plan J".`,
		semver: await read('src/version'),
		ES: 3,
		ESM: true,
		NPM: {
			'...': {
				description: 'The official standard implementation of TabDoc. Belong to "Plan J".／TabDoc 的官方标准实现。从属于“简计划”。',
				keywords: ['TabDoc'],
			},
		},
		UMD: { ES: 3 },
		DOC: true,
	});

});
