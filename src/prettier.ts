import type { Config } from 'prettier';

const config: Config = {
	singleQuote: true,
	semi: true,
	tabWidth: 2,
	useTabs: true,
	printWidth: 120,
	trailingComma: 'all',
	arrowParens: 'always',
	endOfLine: 'lf',
	plugins: ['prettier-plugin-organize-imports'],
};

export default config;
