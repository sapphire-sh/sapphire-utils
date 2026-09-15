import { describe, expect, it } from 'vitest';
import { getArray, getBoolean, getNumber, getObject, getString, isJsonObject, parseJson } from './json';

const sample = {
	object: { nested: 'value' },
	array: [1, 2, 3],
	string: 'text',
	number: 42,
	boolean: true,
	null: null,
};

describe('isJsonObject', () => {
	it('accepts a plain object', () => {
		expect(isJsonObject({ key: 'value' })).toBe(true);
	});

	it('rejects an array', () => {
		expect(isJsonObject([1, 2])).toBe(false);
	});

	it('rejects null', () => {
		expect(isJsonObject(null)).toBe(false);
	});

	it('rejects a scalar', () => {
		expect(isJsonObject('text')).toBe(false);
	});
});

describe('parseJson', () => {
	it('parses an object', () => {
		expect(parseJson('{"key":"value"}')).toEqual({ key: 'value' });
	});

	it('parses an array', () => {
		expect(parseJson('[1,2]')).toEqual([1, 2]);
	});

	it('parses a scalar', () => {
		expect(parseJson('42')).toBe(42);
	});

	it('returns null instead of throwing on invalid JSON', () => {
		expect(parseJson('{key:')).toBeNull();
	});

	it('returns null on an empty string', () => {
		expect(parseJson('')).toBeNull();
	});
});

describe('getObject', () => {
	it('returns the value when it is an object', () => {
		expect(getObject(sample, 'object')).toEqual({ nested: 'value' });
	});

	it('returns null when the value is another type', () => {
		expect(getObject(sample, 'array')).toBeNull();
	});

	it('returns null when the key is absent', () => {
		expect(getObject(sample, 'absent')).toBeNull();
	});
});

describe('getArray', () => {
	it('returns the value when it is an array', () => {
		expect(getArray(sample, 'array')).toEqual([1, 2, 3]);
	});

	it('returns an empty array when the value is another type', () => {
		expect(getArray(sample, 'object')).toEqual([]);
	});

	it('returns an empty array when the key is absent', () => {
		expect(getArray(sample, 'absent')).toEqual([]);
	});
});

describe('getString', () => {
	it('returns the value when it is a string', () => {
		expect(getString(sample, 'string')).toBe('text');
	});

	it('returns null when the value is another type', () => {
		expect(getString(sample, 'number')).toBeNull();
	});

	it('returns null when the key is absent', () => {
		expect(getString(sample, 'absent')).toBeNull();
	});
});

describe('getNumber', () => {
	it('returns the value when it is a number', () => {
		expect(getNumber(sample, 'number')).toBe(42);
	});

	it('returns null when the value is another type', () => {
		expect(getNumber(sample, 'string')).toBeNull();
	});

	it('returns null when the key is absent', () => {
		expect(getNumber(sample, 'absent')).toBeNull();
	});
});

describe('getBoolean', () => {
	it('returns the value when it is a boolean', () => {
		expect(getBoolean(sample, 'boolean')).toBe(true);
	});

	it('returns null when the value is another type', () => {
		expect(getBoolean(sample, 'number')).toBeNull();
	});

	it('returns null when the key is absent', () => {
		expect(getBoolean(sample, 'absent')).toBeNull();
	});
});
