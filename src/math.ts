export const clamp = (value: number, min: number, max: number): number => {
	if (min > max) {
		throw new RangeError(`Invalid clamp range: min ${min} is greater than max ${max}`);
	}
	return Math.min(max, Math.max(min, value));
};
