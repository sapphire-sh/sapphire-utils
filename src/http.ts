import { sleep } from './sleep.js';

export class HttpError extends Error {
	public constructor(
		public readonly status: number,
		statusText: string,
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

export const fetchWithRetry = async (url: string, init?: RequestInit, retryOptions?: FetchRetryOptions): Promise<Response> => {
	const { maxRetries = 3, baseDelayMs = 1000, jitterMs = 500, timeoutMs = 30000 } = retryOptions ?? {};

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		const resp = await fetch(url, {
			signal: AbortSignal.timeout(timeoutMs),
			...init,
		});

		if (resp.ok) {
			return resp;
		}

		const error = new HttpError(resp.status, resp.statusText);
		const isTransient = resp.status === 429 || resp.status >= 500;

		if (!isTransient || attempt === maxRetries) {
			throw error;
		}

		const retryAfterHeader = resp.headers.get('retry-after');
		const delay =
			retryAfterHeader !== null && retryAfterHeader !== ''
				? Number.parseInt(retryAfterHeader, 10) * 1000
				: baseDelayMs * 2 ** attempt;
		await sleep(delay, jitterMs);
	}

	throw new Error('unreachable');
};
