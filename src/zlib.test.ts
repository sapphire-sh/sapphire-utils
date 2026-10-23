import { describe, expect, it } from 'vitest';
import { compress, decompress } from './zlib';

describe('compress', () => {
	it('round-trips a value through decompress', async () => {
		const value = { name: 'example', values: [1, 2, 3] };

		expect(await decompress(await compress(value))).toEqual(value);
	});
});
