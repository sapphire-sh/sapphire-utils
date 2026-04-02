export const serializeError = (error: Error): Record<string, unknown> => {
	return JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error))) as Record<string, unknown>;
};
