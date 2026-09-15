import { describe, expect, it } from 'vitest';
import { clamp } from './math';

describe('clamp', () => {
	it('returns the value when it is inside the range', () => {
		expect(clamp(5, 0, 10)).toBe(5);
	});

	it('returns the minimum when the value is below the range', () => {
		expect(clamp(-3, 0, 10)).toBe(0);
	});

	it('returns the maximum when the value is above the range', () => {
		expect(clamp(42, 0, 10)).toBe(10);
	});

	it('returns the bounds themselves unchanged', () => {
		expect(clamp(0, 0, 10)).toBe(0);
		expect(clamp(10, 0, 10)).toBe(10);
	});

	it('handles a range that is a single point', () => {
		expect(clamp(7, 3, 3)).toBe(3);
	});

	it('handles negative ranges', () => {
		expect(clamp(-5, -10, -1)).toBe(-5);
		expect(clamp(0, -10, -1)).toBe(-1);
	});

	it('throws when min is greater than max', () => {
		expect(() => clamp(5, 10, 0)).toThrow(RangeError);
	});
});
