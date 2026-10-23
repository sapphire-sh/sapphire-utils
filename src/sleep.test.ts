import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sleep } from './sleep';

describe('sleep', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('resolves after the specified delay', async () => {
		let resolved = false;
		const promise = (async () => {
			await sleep(500);
			resolved = true;
		})();

		expect(resolved).toBe(false);
		vi.advanceTimersByTime(500);
		await promise;
		expect(resolved).toBe(true);
	});

	it('returns a Promise', () => {
		const result = sleep(0);
		expect(result).toBeInstanceOf(Promise);
		vi.runAllTimers();
	});

	it('accepts a jitter parameter', async () => {
		// A Math.random of 0.5 adds half of the 100ms jitter to the 200ms delay.
		vi.spyOn(Math, 'random').mockReturnValue(0.5);
		let resolved = false;
		const promise = (async () => {
			await sleep(200, 100);
			resolved = true;
		})();

		await vi.advanceTimersByTimeAsync(249);
		expect(resolved).toBe(false);
		await vi.advanceTimersByTimeAsync(1);
		await promise;
		expect(resolved).toBe(true);
		vi.mocked(Math.random).mockRestore();
	});
});
