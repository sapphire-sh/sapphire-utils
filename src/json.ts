export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

export interface JsonObject {
	[key: string]: JsonValue;
}

export const isJsonObject = (value: unknown): value is JsonObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseJson = (text: string): JsonValue | null => {
	try {
		const parsed: JsonValue = JSON.parse(text);
		return parsed;
	} catch {
		return null;
	}
};

export const getObject = (object: JsonObject, key: string): JsonObject | null => {
	const value = object[key];
	return isJsonObject(value) ? value : null;
};

export const getArray = (object: JsonObject, key: string): JsonValue[] => {
	const value = object[key];
	return Array.isArray(value) ? value : [];
};

export const getString = (object: JsonObject, key: string): string | null => {
	const value = object[key];
	return typeof value === 'string' ? value : null;
};

export const getNumber = (object: JsonObject, key: string): number | null => {
	const value = object[key];
	return typeof value === 'number' ? value : null;
};

export const getBoolean = (object: JsonObject, key: string): boolean | null => {
	const value = object[key];
	return typeof value === 'boolean' ? value : null;
};
