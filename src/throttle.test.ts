import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { throttle } from './throttle';

describe('throttle', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('calls the function on first invocation', () => {
		const fn = vi.fn(() => 'result');
		const throttled = throttle(fn, 1000);

		expect(throttled()).toBe('result');
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('suppresses calls within the interval', () => {
		const fn = vi.fn(() => 'result');
		const throttled = throttle(fn, 1000);

		throttled();
		vi.advanceTimersByTime(500);
		expect(throttled()).toBeUndefined();
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('allows a call after the interval has elapsed', () => {
		const fn = vi.fn(() => 'result');
		const throttled = throttle(fn, 1000);

		throttled();
		vi.advanceTimersByTime(1001);
		throttled();
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it('passes arguments to the underlying function', () => {
		const fn = vi.fn((a: number, b: number) => a + b);
		const throttled = throttle(fn, 1000);

		throttled(2, 3);
		expect(fn).toHaveBeenCalledWith(2, 3);
	});
});
