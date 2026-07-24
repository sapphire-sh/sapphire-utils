import { describe, expect, it } from 'vitest';
import { formatDuration } from './date';

describe('formatDuration', () => {
	it('shows sub-second durations at ms resolution', () => {
		expect(formatDuration(10)).toBe('10ms');
		expect(formatDuration(0)).toBe('0ms');
		expect(formatDuration(999)).toBe('999ms');
	});

	it('keeps h/m/s formatting for durations at or above one second', () => {
		expect(formatDuration(1200)).toBe('2s');
		expect(formatDuration(123456)).toBe('2m 4s');
	});

	it('formats hours, minutes, and seconds together', () => {
		expect(formatDuration(3661000)).toBe('1h 1m 1s');
	});
});
