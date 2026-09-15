import { retry } from './retry.js';

export class HttpError extends Error {
	public constructor(
		public readonly status: number,
		statusText: string,
		public readonly retryAfterMs?: number,
	) {
		super(`HTTP ${status} ${statusText}`);
	}
}

export interface FetchRetryOptions {
	maxRetries?: number;
	baseDelayMs?: number;
	jitterMs?: number;
	timeoutMs?: number;
}

const parseRetryAfterMs = (response: Response): number | undefined => {
	const header = response.headers.get('retry-after');
	if (header === null || header === '') {
		return undefined;
	}
	return Number.parseInt(header, 10) * 1000;
};

export const fetchWithRetry = async (
	url: string,
	init?: RequestInit,
	retryOptions?: FetchRetryOptions,
): Promise<Response> => {
	const { maxRetries = 3, baseDelayMs = 1000, jitterMs = 500, timeoutMs = 30000 } = retryOptions ?? {};

	return retry(
		async () => {
			const resp = await fetch(url, {
				signal: AbortSignal.timeout(timeoutMs),
				...init,
			});

			if (resp.ok) {
				return resp;
			}

			throw new HttpError(resp.status, resp.statusText, parseRetryAfterMs(resp));
		},
		{
			maxAttempts: maxRetries + 1,
			baseDelayMs,
			jitterMs,
			isRetryable: (error) => error instanceof HttpError && (error.status === 429 || error.status >= 500),
			delayMs: (error) => (error instanceof HttpError ? error.retryAfterMs : undefined),
		},
	);
};

export const fetchJson = async <T>(url: string, init?: RequestInit, retryOptions?: FetchRetryOptions): Promise<T> => {
	const resp = await fetchWithRetry(url, init, retryOptions);
	const parsed: T = await resp.json();
	return parsed;
};
