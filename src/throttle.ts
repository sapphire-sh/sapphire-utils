export const throttle = <T, R>(fn: (...args: T[]) => R, interval: number) => {
	let timestamp = 0;

	return (...args: T[]): R | undefined => {
		const now = Date.now();
		if (now - timestamp < interval) {
			return;
		}

		timestamp = now;
		return fn(...args);
	};
};
