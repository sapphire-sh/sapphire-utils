import { describe, expect, it } from 'vitest';
import { formatDate, formatDuration, toLocalISOString } from './date';

describe('formatDate', () => {
	it('uses the given timezone for an instant before UTC midnight', () => {
		const instant = Temporal.Instant.from('2026-01-01T23:30:00Z');

		expect(formatDate(instant, 'UTC')).toBe('2026-01-01');
		expect(formatDate(instant, 'Asia/Tokyo')).toBe('2026-01-02');
	});

	it('uses the given timezone for an instant just after UTC midnight', () => {
		const instant = Temporal.Instant.from('2026-01-01T00:30:00Z');

		expect(formatDate(instant, 'UTC')).toBe('2026-01-01');
		expect(formatDate(instant, 'America/Los_Angeles')).toBe('2025-12-31');
	});

	it('pads single-digit months and days', () => {
		expect(formatDate(Temporal.Instant.from('2026-03-04T12:00:00Z'), 'UTC')).toBe('2026-03-04');
	});

	it('falls back to the local timezone when none is given', () => {
		const instant = Temporal.Instant.from('2026-03-04T12:00:00Z');
		const local = instant.toZonedDateTimeISO(Temporal.Now.timeZoneId());

		expect(formatDate(instant)).toBe(local.toPlainDate().toString());
	});
});

describe('toLocalISOString', () => {
	it('renders the local wall time with millisecond precision and the local offset', () => {
		const instant = Temporal.Instant.from('2026-03-04T12:00:00.007Z');
		const local = instant.toZonedDateTimeISO(Temporal.Now.timeZoneId());

		expect(toLocalISOString(instant)).toBe(
			`${local.toPlainDateTime().toString({ smallestUnit: 'millisecond' })}${local.offset}`,
		);
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
