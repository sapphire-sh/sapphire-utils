import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from './logger';
import { notifyMattermost, notifySlack, pingHealthchecks } from './notify';
import { sleep } from './sleep';

vi.mock('./sleep.js', () => ({
	sleep: vi.fn().mockResolvedValue(undefined),
}));

const mockUrl = 'https://example.com/webhook';

describe('notifySlack', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
		vi.mocked(sleep).mockClear();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('sends a POST request with the correct body', async () => {
		vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

		await notifySlack(mockUrl, 'hello');

		expect(fetch).toHaveBeenCalledWith(mockUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text: 'hello' }),
		});
	});

	it('throws when the response is not ok', async () => {
		vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }));

		await expect(notifySlack(mockUrl, 'hello')).rejects.toThrow('Slack webhook failed: HTTP 500');
	});

	it('does not retry when the failure is not a rate limit', async () => {
		vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }));

		await expect(notifySlack(mockUrl, 'hello')).rejects.toThrow('Slack webhook failed: HTTP 500');

		expect(fetch).toHaveBeenCalledTimes(1);
		expect(sleep).not.toHaveBeenCalled();
	});

	it('retries after waiting for the Retry-After duration when rate limited', async () => {
		vi.mocked(fetch)
			.mockResolvedValueOnce(new Response(null, { status: 429, headers: { 'Retry-After': '3' } }))
			.mockResolvedValueOnce(new Response(null, { status: 200 }));

		await notifySlack(mockUrl, 'hello');

		expect(fetch).toHaveBeenCalledTimes(2);
		expect(sleep).toHaveBeenCalledWith(3000);
	});

	it('retries after the fallback delay when Retry-After is absent', async () => {
		vi.mocked(fetch)
			.mockResolvedValueOnce(new Response(null, { status: 429 }))
			.mockResolvedValueOnce(new Response(null, { status: 200 }));

		await notifySlack(mockUrl, 'hello');

		expect(fetch).toHaveBeenCalledTimes(2);
		expect(sleep).toHaveBeenCalledWith(2048);
	});

	it('throws after exhausting retries when rate limiting persists', async () => {
		vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 429 }));

		await expect(notifySlack(mockUrl, 'hello')).rejects.toThrow('Slack webhook failed: HTTP 429');

		expect(fetch).toHaveBeenCalledTimes(3);
		expect(sleep).toHaveBeenCalledTimes(2);
	});
});

describe('notifyMattermost', () => {
	const baseUrl = 'https://mattermost.example.com';
	const token = 'mytoken';
	const channelId = 'abc123';

	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('sends a POST request with the correct body', async () => {
		vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

		await notifyMattermost(baseUrl, token, channelId, 'hello');

		expect(fetch).toHaveBeenCalledWith(`${baseUrl}/api/v4/posts`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ channel_id: channelId, message: 'hello' }),
		});
	});

	it('throws when the response is not ok', async () => {
		vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 403 }));

		await expect(notifyMattermost(baseUrl, token, channelId, 'hello')).rejects.toThrow(
			'Mattermost post failed: HTTP 403',
		);
	});
});

describe('pingHealthchecks', () => {
	const pingUrl = 'https://hc.example.com/ping/abc123';

	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
		vi.spyOn(logger, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('sends a GET request with a timeout signal', async () => {
		vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

		await expect(pingHealthchecks(pingUrl)).resolves.toBeUndefined();

		expect(fetch).toHaveBeenCalledWith(
			pingUrl,
			expect.objectContaining({ method: 'GET', signal: expect.any(AbortSignal) }),
		);
		expect(logger.warn).not.toHaveBeenCalled();
	});

	it('warns without throwing when the response is not ok', async () => {
		vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 503 }));

		await expect(pingHealthchecks(pingUrl)).resolves.toBeUndefined();

		expect(logger.warn).toHaveBeenCalledTimes(1);
		expect(logger.warn).toHaveBeenCalledWith(expect.any(String), { status: 503 });
	});

	it('warns without throwing when the request fails', async () => {
		vi.mocked(fetch).mockRejectedValue(new Error('network down'));

		await expect(pingHealthchecks(pingUrl)).resolves.toBeUndefined();

		expect(logger.warn).toHaveBeenCalledTimes(1);
		expect(logger.warn).toHaveBeenCalledWith(expect.any(String), { message: 'network down' });
	});
});
