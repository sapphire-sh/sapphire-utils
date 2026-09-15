import { afterEach, describe, expect, it } from 'vitest';
import { readEnv, requireEnv } from './env';

const variableName = 'SAPPHIRE_UTILS_TEST_ENV';

describe('readEnv', () => {
	afterEach(() => {
		delete process.env[variableName];
	});

	it('returns undefined when the variable is unset', () => {
		delete process.env[variableName];
		expect(readEnv(variableName)).toBeUndefined();
	});

	it('returns undefined when the variable is an empty string', () => {
		process.env[variableName] = '';
		expect(readEnv(variableName)).toBeUndefined();
	});

	it('returns the value when the variable is set', () => {
		process.env[variableName] = 'value';
		expect(readEnv(variableName)).toBe('value');
	});
});

describe('requireEnv', () => {
	afterEach(() => {
		delete process.env[variableName];
	});

	it('throws when the variable is unset', () => {
		delete process.env[variableName];
		expect(() => requireEnv(variableName)).toThrow(`Missing required env var: ${variableName}`);
	});

	it('throws when the variable is an empty string', () => {
		process.env[variableName] = '';
		expect(() => requireEnv(variableName)).toThrow(`Missing required env var: ${variableName}`);
	});

	it('returns the value when the variable is set', () => {
		process.env[variableName] = 'value';
		expect(requireEnv(variableName)).toBe('value');
	});
});
