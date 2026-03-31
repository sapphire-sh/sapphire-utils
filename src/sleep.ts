export const sleep = async (ms: number, jitter = 0): Promise<void> => {
	const delay = ms + Math.random() * jitter;
	return new Promise((resolve) => globalThis.setTimeout(resolve, delay));
};
