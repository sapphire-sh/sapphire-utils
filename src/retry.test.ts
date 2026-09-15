import { describe, expect, it, vi } from 'vitest';
import { retry } from './retry';

const fastOptions = { baseDelayMs: 1, jitterMs: 0 };

describe('retry', () => {
	it('returns the value without retrying when the function succeeds', async () => {
		const fn = vi.fn(async () => 'ok');

		await expect(retry(fn, fastOptions)).resolves.toBe('ok');
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('retries until the function succeeds', async () => {
		const fn = vi
			.fn<() => Promise<string>>()
			.mockRejectedValueOnce(new Error('first'))
			.mockRejectedValueOnce(new Error('second'))
			.mockResolvedValue('ok');

		await expect(retry(fn, fastOptions)).resolves.toBe('ok');
		expect(fn).toHaveBeenCalledTimes(3);
	});

	it('throws immediately when isRetryable returns false', async () => {
		const error = new Error('fatal');
		const fn = vi.fn<() => Promise<string>>().mockRejectedValue(error);

		await expect(retry(fn, { ...fastOptions, isRetryable: () => false })).rejects.toBe(error);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('throws the last error once the attempts are exhausted', async () => {
		const error = new Error('exhausted');
		const fn = vi.fn<() => Promise<string>>().mockRejectedValue(error);

		await expect(retry(fn, { ...fastOptions, maxAttempts: 3 })).rejects.toBe(error);
		expect(fn).toHaveBeenCalledTimes(3);
	});

	it('doubles the delay on each attempt by default', async () => {
		const fn = vi
			.fn<() => Promise<string>>()
			.mockRejectedValueOnce(new Error('first'))
			.mockRejectedValueOnce(new Error('second'))
			.mockResolvedValue('ok');
		const onRetry = vi.fn();

		await retry(fn, { baseDelayMs: 4, jitterMs: 0, onRetry });

		expect(onRetry.mock.calls.map((call) => call[2])).toEqual([4, 8]);
	});

	it('uses the delayMs return value instead of the backoff', async () => {
		const fn = vi.fn<() => Promise<string>>().mockRejectedValueOnce(new Error('first')).mockResolvedValue('ok');
		const onRetry = vi.fn();

		await retry(fn, { baseDelayMs: 4096, jitterMs: 0, delayMs: () => 1, onRetry });

		expect(onRetry.mock.calls.map((call) => call[2])).toEqual([1]);
	});

	it('falls back to the backoff when delayMs returns undefined', async () => {
		const fn = vi.fn<() => Promise<string>>().mockRejectedValueOnce(new Error('first')).mockResolvedValue('ok');
		const onRetry = vi.fn();

		await retry(fn, { baseDelayMs: 4, jitterMs: 0, delayMs: () => undefined, onRetry });

		expect(onRetry.mock.calls.map((call) => call[2])).toEqual([4]);
	});

	it('passes the error and attempt number to onRetry', async () => {
		const error = new Error('first');
		const fn = vi.fn<() => Promise<string>>().mockRejectedValueOnce(error).mockResolvedValue('ok');
		const onRetry = vi.fn();

		await retry(fn, { ...fastOptions, onRetry });

		expect(onRetry).toHaveBeenCalledTimes(1);
		expect(onRetry).toHaveBeenCalledWith(error, 1, 1);
	});
});
