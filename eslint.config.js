import { defineConfig } from 'eslint/config';
import config from './lib/esm/eslint.js';

export default defineConfig(...config, {
	languageOptions: {
		parserOptions: {
			project: './tsconfig.eslint.json',
		},
	},
});
