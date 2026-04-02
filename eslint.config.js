import { defineConfig } from 'eslint/config';
import config from './lib/eslint.js';

export default defineConfig(
	...config,
	{
		languageOptions: {
			parserOptions: {
				project: './tsconfig.eslint.json',
			},
		},
	},
	{
		files: ['bin/**/*.js'],
		languageOptions: {
			globals: { console: 'readonly', process: 'readonly' },
		},
	},
);
