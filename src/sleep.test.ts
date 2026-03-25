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
		const promise = sleep(500).then(() => {
			resolved = true;
		});

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
		// With jitter=0, delay is exactly ms
		vi.spyOn(Math, 'random').mockReturnValue(0);
		const promise = sleep(200, 100);
		vi.advanceTimersByTime(200);
		await promise;
		vi.mocked(Math.random).mockRestore();
	});
});
