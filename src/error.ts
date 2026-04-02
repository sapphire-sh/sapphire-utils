export const serializeError = (error: Error): Record<string, unknown> =>
	JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));
