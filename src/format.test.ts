import { describe, expect, it } from 'vitest';
import { formatBytes } from './format';

describe('formatBytes', () => {
	it('formats zero as bytes', () => {
		expect(formatBytes(0)).toBe('0 B');
	});

	it('formats a value just below the first unit as bytes', () => {
		expect(formatBytes(1023)).toBe('1023 B');
	});

	it('formats exactly one kilobyte', () => {
		expect(formatBytes(1024)).toBe('1.0 KB');
	});

	it('formats a fractional kilobyte value', () => {
		expect(formatBytes(1536)).toBe('1.5 KB');
	});

	it('keeps the kilobyte unit just below the megabyte boundary', () => {
		expect(formatBytes(1024 * 1024 - 1)).toBe('1024.0 KB');
	});

	it('steps up to megabytes at the boundary', () => {
		expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
	});

	it('formats a fractional megabyte value', () => {
		expect(formatBytes(1024 * 1024 * 1.5)).toBe('1.5 MB');
	});

	it('steps up to gigabytes at the boundary', () => {
		expect(formatBytes(1024 ** 3)).toBe('1.0 GB');
	});

	it('steps up to terabytes at the boundary', () => {
		expect(formatBytes(1024 ** 4)).toBe('1.0 TB');
	});

	it('stays in terabytes above the terabyte range', () => {
		expect(formatBytes(1024 ** 5)).toBe('1024.0 TB');
	});

	it('rounds to one decimal place', () => {
		expect(formatBytes(1124)).toBe('1.1 KB');
	});
});
