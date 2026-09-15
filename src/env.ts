export const readEnv = (name: string): string | undefined => {
	// The root entry re-exports modules that read env at load time, so a browser
	// bundle without `process` must get undefined rather than a ReferenceError.
	if (typeof process === 'undefined') {
		return undefined;
	}

	const value = process.env[name];
	if (value === undefined || value === '') {
		return undefined;
	}
	return value;
};

export const requireEnv = (name: string): string => {
	const value = readEnv(name);
	if (value === undefined) {
		throw new Error(`Missing required env var: ${name}`);
	}
	return value;
};
