'use strict';

require('../test').then(() => {
	
	require('@ltd/j-dev').
		
		build({
			dir: __dirname+'/..',
			ES: 3,
			name: 'j-tabdoc',
			Name: 'jTabDoc',
			Desc: `
				TabDoc 的官方标准实现。从属于“简计划”。
				The official standard implementation of TabDoc. Belong to "Plan J".`,
			semver:
				require('fs').readFileSync(__dirname+'/../version')+'',
			ESM: true,
			NPM: {
				'...': {
					description: 'The official standard implementation of TabDoc. Belong to "Plan J".／TabDoc 的官方标准实现。从属于“简计划”。',
				},
			},
			UMD: { ES: 3 },
			DOC: true,
		}).
		
		catch(console.error);
	
}, () => {});
