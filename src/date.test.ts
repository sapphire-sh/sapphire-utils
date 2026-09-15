import { describe, expect, it } from 'vitest';
import { formatDate, formatDuration } from './date';

describe('formatDate', () => {
	it('uses the given timezone for an instant before UTC midnight', () => {
		const date = new Date('2026-01-01T23:30:00Z');

		expect(formatDate(date, 'UTC')).toBe('2026-01-01');
		expect(formatDate(date, 'Asia/Tokyo')).toBe('2026-01-02');
	});

	it('uses the given timezone for an instant just after UTC midnight', () => {
		const date = new Date('2026-01-01T00:30:00Z');

		expect(formatDate(date, 'UTC')).toBe('2026-01-01');
		expect(formatDate(date, 'America/Los_Angeles')).toBe('2025-12-31');
	});

	it('pads single-digit months and days', () => {
		expect(formatDate(new Date('2026-03-04T12:00:00Z'), 'UTC')).toBe('2026-03-04');
	});

	it('falls back to the local timezone when none is given', () => {
		const date = new Date('2026-03-04T12:00:00Z');
		const month = `${date.getMonth() + 1}`.padStart(2, '0');
		const day = `${date.getDate()}`.padStart(2, '0');

		expect(formatDate(date)).toBe(`${date.getFullYear()}-${month}-${day}`);
	});
});

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
