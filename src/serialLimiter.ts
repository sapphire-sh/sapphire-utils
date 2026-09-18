import { sleep } from './sleep.js';

export type SerialLimiter = <T>(task: () => Promise<T>, key?: string) => Promise<T>;

export const createSerialLimiter = (minIntervalMs: number): SerialLimiter => {
	const tails = new Map<string, Promise<unknown>>();
	const startedAt = new Map<string, number>();

	return async <T>(task: () => Promise<T>, key = ''): Promise<T> => {
		const previous = tails.get(key);

		const run = (async (): Promise<T> => {
			if (previous !== undefined) {
				await previous;
			}

			const previousStartedAt = startedAt.get(key);
			if (previousStartedAt !== undefined) {
				const remainingMs = minIntervalMs - (Temporal.Now.instant().epochMilliseconds - previousStartedAt);
				if (remainingMs > 0) {
					await sleep(remainingMs);
				}
			}

			startedAt.set(key, Temporal.Now.instant().epochMilliseconds);
			return task();
		})();

		tails.set(key, Promise.allSettled([run]));
		return run;
	};
};
