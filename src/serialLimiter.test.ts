import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSerialLimiter } from './serialLimiter';
import { sleep } from './sleep';

describe('createSerialLimiter', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('starts the next task only after the previous one settles', async () => {
		const limiter = createSerialLimiter(0);
		const events: string[] = [];
		const gate = Promise.withResolvers<void>();

		const first = limiter(async () => {
			events.push('first:start');
			await gate.promise;
			events.push('first:end');
		});
		const second = limiter(async () => {
			events.push('second:start');
		});

		await vi.advanceTimersByTimeAsync(0);
		expect(events).toEqual(['first:start']);

		gate.resolve();
		await vi.advanceTimersByTimeAsync(0);
		expect(events).toEqual(['first:start', 'first:end', 'second:start']);

		await first;
		await second;
	});

	it('waits out the minimum interval before starting the next task', async () => {
		const limiter = createSerialLimiter(1000);
		const events: string[] = [];

		const first = limiter(async () => {
			events.push('first');
		});
		const second = limiter(async () => {
			events.push('second');
		});

		await vi.advanceTimersByTimeAsync(0);
		expect(events).toEqual(['first']);

		await vi.advanceTimersByTimeAsync(999);
		expect(events).toEqual(['first']);

		await vi.advanceTimersByTimeAsync(1);
		expect(events).toEqual(['first', 'second']);

		await first;
		await second;
	});

	it('does not wait when the minimum interval has already elapsed', async () => {
		const limiter = createSerialLimiter(1000);
		const events: string[] = [];

		const first = limiter(async () => {
			events.push('first');
			await sleep(1000);
		});
		await vi.advanceTimersByTimeAsync(1000);
		await first;

		const second = limiter(async () => {
			events.push('second');
		});
		await vi.advanceTimersByTimeAsync(0);
		expect(events).toEqual(['first', 'second']);

		await second;
	});

	it('runs the next task after the previous one fails', async () => {
		const limiter = createSerialLimiter(0);
		const events: string[] = [];

		const failing = limiter(async () => {
			events.push('failing');
			throw new Error('boom');
		});
		const next = limiter(async () => {
			events.push('next');
		});

		await expect(failing).rejects.toThrow('boom');
		await vi.advanceTimersByTimeAsync(0);
		await next;

		expect(events).toEqual(['failing', 'next']);
	});

	it('runs tasks with different keys without waiting for each other', async () => {
		const limiter = createSerialLimiter(1000);
		const events: string[] = [];

		const first = limiter(async () => {
			events.push('first');
		}, 'first');
		const second = limiter(async () => {
			events.push('second');
		}, 'second');

		await vi.advanceTimersByTimeAsync(0);
		expect(events).toEqual(['first', 'second']);

		await first;
		await second;
	});

	it('returns the task result', async () => {
		const limiter = createSerialLimiter(0);

		const result = limiter(async () => 'value');
		await vi.advanceTimersByTimeAsync(0);

		await expect(result).resolves.toBe('value');
	});
});
