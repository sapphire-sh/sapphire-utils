declare module 'eslint-plugin-promise' {
	import type { Linter } from 'eslint';

	const plugin: {
		configs: {
			recommended: Linter.Config;
			'flat/recommended': Linter.Config;
		};
	};

	export default plugin;
}
