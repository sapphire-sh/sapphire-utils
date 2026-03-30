import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { notifyMattermost, notifySlack } from './notify';

const mockUrl = 'https://example.com/webhook';

describe('notifySlack', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
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
