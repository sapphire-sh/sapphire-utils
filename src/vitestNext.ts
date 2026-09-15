import path from 'node:path';
import { mergeConfig } from 'vitest/config';
import base from './vitest.js';

// vitest runs from the project root, so cwd-relative paths point at the consuming project.
export default mergeConfig(base, {
	resolve: {
		alias: {
			'@': path.resolve(process.cwd(), 'src'),
		},
	},
	test: {
		include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
		exclude: ['**/node_modules/**', '**/.next/**'],
	},
});
