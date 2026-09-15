export const readEnv = (name: string): string | undefined => {
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
