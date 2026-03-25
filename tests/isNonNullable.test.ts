import { describe, expect, it } from 'vitest';
import { isNonNullable } from '../src/isNonNullable';

describe('isNonNullable', () => {
	it('returns true for non-null, non-undefined values', () => {
		expect(isNonNullable(0)).toBe(true);
		expect(isNonNullable('')).toBe(true);
		expect(isNonNullable(false)).toBe(true);
		expect(isNonNullable({})).toBe(true);
		expect(isNonNullable([])).toBe(true);
		expect(isNonNullable(42)).toBe(true);
		expect(isNonNullable('hello')).toBe(true);
	});

	it('returns false for null', () => {
		expect(isNonNullable(null)).toBe(false);
	});

	it('returns false for undefined', () => {
		expect(isNonNullable(undefined)).toBe(false);
		expect(isNonNullable()).toBe(false);
	});
});
