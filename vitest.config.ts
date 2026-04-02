import { mergeConfig } from 'vitest/config';
import base from './lib/esm/vitest.js';

export default mergeConfig(base, {
	test: {
		coverage: {
			reporter: ['lcov'],
			exclude: ['src/index.ts', 'src/prettier.ts'],
		},
	},
});
