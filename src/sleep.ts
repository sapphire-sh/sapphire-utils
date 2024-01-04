export const sleep = (ms: number): Promise<void> => {
	return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
};
