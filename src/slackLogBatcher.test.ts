import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from './logger';
import { notifySlack } from './notify';
import { chunkLines, createSlackLogBatcher } from './slackLogBatcher';

vi.mock('./notify.js', () => ({
	notifySlack: vi.fn().mockResolvedValue(undefined),
}));

const webhookUrl = 'https://example.com/webhook';

describe('chunkLines', () => {
	it('returns no chunks for an empty input', () => {
		expect(chunkLines([], 16)).toEqual([]);
	});

	it('joins lines that fit into a single chunk', () => {
		expect(chunkLines(['ab', 'cd'], 16)).toEqual(['ab\ncd']);
	});

	it('keeps a line that exceeds the limit on its own as one chunk', () => {
		expect(chunkLines(['abcdefgh', 'ij'], 4)).toEqual(['abcdefgh', 'ij']);
	});

	it('fills a chunk up to exactly the limit', () => {
		expect(chunkLines(['ab', 'cd'], 5)).toEqual(['ab\ncd']);
	});

	it('starts a new chunk when one more line would exceed the limit', () => {
		expect(chunkLines(['ab', 'cd'], 4)).toEqual(['ab', 'cd']);
	});

	it('keeps empty lines', () => {
		expect(chunkLines(['', 'ab'], 16)).toEqual(['\nab']);
	});
});

describe('createSlackLogBatcher', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.mocked(notifySlack).mockClear();
		vi.mocked(notifySlack).mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('sends the queued lines once the flush interval elapses', async () => {
		const batcher = createSlackLogBatcher({ webhookUrl, flushIntervalMs: 1000 });

		batcher.enqueue('first');
		batcher.enqueue('second');
		expect(notifySlack).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(1000);

		expect(notifySlack).toHaveBeenCalledTimes(1);
		expect(notifySlack).toHaveBeenCalledWith(webhookUrl, 'first\nsecond');
	});

	it('sends one message per chunk in order', async () => {
		const batcher = createSlackLogBatcher({ webhookUrl, flushIntervalMs: 1000, maxChunkLength: 4 });

		batcher.enqueue('ab');
		batcher.enqueue('cd');
		await vi.advanceTimersByTimeAsync(1000);

		expect(vi.mocked(notifySlack).mock.calls).toEqual([
			[webhookUrl, 'ab'],
			[webhookUrl, 'cd'],
		]);
	});

	it('does not send again when the interval elapses with an empty queue', async () => {
		const batcher = createSlackLogBatcher({ webhookUrl, flushIntervalMs: 1000 });

		batcher.enqueue('first');
		await vi.advanceTimersByTimeAsync(1000);
		await vi.advanceTimersByTimeAsync(1000);

		expect(notifySlack).toHaveBeenCalledTimes(1);
	});

	it('cancels the scheduled timer when flush is called', async () => {
		const batcher = createSlackLogBatcher({ webhookUrl, flushIntervalMs: 1000 });

		batcher.enqueue('first');
		await batcher.flush();
		expect(notifySlack).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(500);
		batcher.enqueue('second');

		// The cancelled timer would have fired here had flush left it scheduled
		await vi.advanceTimersByTimeAsync(500);
		expect(notifySlack).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(500);
		expect(notifySlack).toHaveBeenCalledTimes(2);
		expect(notifySlack).toHaveBeenLastCalledWith(webhookUrl, 'second');
	});

	it('sends nothing when flush runs with an empty queue', async () => {
		const batcher = createSlackLogBatcher({ webhookUrl });

		await batcher.flush();

		expect(notifySlack).not.toHaveBeenCalled();
	});

	it('logs the failure instead of throwing when a send fails', async () => {
		const error = new Error('webhook down');
		vi.mocked(notifySlack).mockRejectedValueOnce(error);
		const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
		const batcher = createSlackLogBatcher({ webhookUrl, flushIntervalMs: 1000, maxChunkLength: 4 });

		batcher.enqueue('ab');
		batcher.enqueue('cd');

		await expect(batcher.flush()).resolves.toBeUndefined();

		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(errorSpy).toHaveBeenCalledWith(expect.any(String), error);
		// the remaining chunk is still sent after the failure
		expect(notifySlack).toHaveBeenCalledTimes(2);
	});
});
