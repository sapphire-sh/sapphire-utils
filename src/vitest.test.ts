import { describe, expect, it } from 'vitest';
import config from './vitest';

describe('vitest config', () => {
	it('includes ts and tsx sources in coverage', () => {
		expect(config.test?.coverage?.include).toEqual(['src/**/*.{ts,tsx}']);
	});
});
