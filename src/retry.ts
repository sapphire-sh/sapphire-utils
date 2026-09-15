import { sleep } from './sleep.js';

export interface RetryOptions {
	maxAttempts?: number;
	baseDelayMs?: number;
	jitterMs?: number;
	isRetryable?: (error: unknown) => boolean;
	delayMs?: (error: unknown, attempt: number) => number | undefined;
	onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

export const retry = async <T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> => {
	const {
		maxAttempts = 4,
		baseDelayMs = 1024,
		jitterMs = 512,
		isRetryable = () => true,
		delayMs,
		onRetry,
	} = options ?? {};

	for (let attempt = 1; ; attempt++) {
		try {
			return await fn();
		} catch (error) {
			if (attempt >= maxAttempts || !isRetryable(error)) {
				throw error;
			}

			const resolvedDelayMs = delayMs?.(error, attempt) ?? baseDelayMs * 2 ** (attempt - 1);
			onRetry?.(error, attempt, resolvedDelayMs);
			await sleep(resolvedDelayMs, jitterMs);
		}
	}
};
