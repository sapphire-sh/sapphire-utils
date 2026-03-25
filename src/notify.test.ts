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
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('sends a POST request with the correct body', async () => {
		vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

		await notifyMattermost(mockUrl, 'hello');

		expect(fetch).toHaveBeenCalledWith(mockUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text: 'hello' }),
		});
	});

	it('throws when the response is not ok', async () => {
		vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 403 }));

		await expect(notifyMattermost(mockUrl, 'hello')).rejects.toThrow('Mattermost webhook failed: HTTP 403');
	});
});
