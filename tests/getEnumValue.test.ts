import { describe, expect, it } from 'vitest';
import { getEnumValue } from '../src/getEnumValue';

enum Color {
	Red = 'red',
	Blue = 'blue',
	Green = 'green',
}

const getColor = getEnumValue(Color);

describe('getEnumValue', () => {
	it('returns the enum value when the string matches', () => {
		expect(getColor('red')).toBe(Color.Red);
		expect(getColor('blue')).toBe(Color.Blue);
		expect(getColor('green')).toBe(Color.Green);
	});

	it('returns null for a non-matching string', () => {
		expect(getColor('yellow')).toBeNull();
		expect(getColor('RED')).toBeNull();
	});

	it('returns null for undefined input', () => {
		expect(getColor()).toBeNull();
	});

	it('returns null for empty string', () => {
		expect(getColor('')).toBeNull();
	});
});
