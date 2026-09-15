import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, fetchWithRetry } from './http';

const url = 'https://example.test/resource';
const fastOptions = { baseDelayMs: 1, jitterMs: 0 };

const mockFetch = () => vi.spyOn(globalThis, 'fetch');

describe('fetchWithRetry', () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('returns the response without retrying when it is ok', async () => {
		const fetchMock = mockFetch().mockResolvedValue(new Response('body', { status: 200 }));

		const response = await fetchWithRetry(url, undefined, fastOptions);

		expect(response.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('retries on 429 and returns the eventual response', async () => {
		const fetchMock = mockFetch()
			.mockResolvedValueOnce(new Response(null, { status: 429, statusText: 'Too Many Requests' }))
			.mockResolvedValue(new Response('body', { status: 200 }));

		const response = await fetchWithRetry(url, undefined, fastOptions);

		expect(response.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('retries on 500 and returns the eventual response', async () => {
		const fetchMock = mockFetch()
			.mockResolvedValueOnce(new Response(null, { status: 500, statusText: 'Internal Server Error' }))
			.mockResolvedValue(new Response('body', { status: 200 }));

		const response = await fetchWithRetry(url, undefined, fastOptions);

		expect(response.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('throws an HttpError without retrying on 404', async () => {
		const fetchMock = mockFetch().mockResolvedValue(new Response(null, { status: 404, statusText: 'Not Found' }));

		await expect(fetchWithRetry(url, undefined, fastOptions)).rejects.toThrow(HttpError);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('throws the HttpError once the retries are exhausted', async () => {
		const fetchMock = mockFetch().mockResolvedValue(
			new Response(null, { status: 503, statusText: 'Service Unavailable' }),
		);

		await expect(fetchWithRetry(url, undefined, { ...fastOptions, maxRetries: 2 })).rejects.toThrow('HTTP 503');
		expect(fetchMock).toHaveBeenCalledTimes(3);
	});

	it('waits the Retry-After header instead of the exponential backoff', async () => {
		const fetchMock = mockFetch()
			.mockResolvedValueOnce(
				new Response(null, {
					status: 429,
					statusText: 'Too Many Requests',
					headers: { 'retry-after': '2' },
				}),
			)
			.mockResolvedValue(new Response('body', { status: 200 }));
		vi.useFakeTimers();

		const promise = fetchWithRetry(url, undefined, { baseDelayMs: 60000, jitterMs: 0 });

		await vi.advanceTimersByTimeAsync(1999);
		expect(fetchMock).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(1);
		await expect(promise).resolves.toMatchObject({ status: 200 });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
