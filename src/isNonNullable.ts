export const isNonNullable = <T>(value?: T | null): value is NonNullable<T> => {
	if (value === null) {
		return false;
	}
	if (value === undefined) {
		return false;
	}
	return true;
};
