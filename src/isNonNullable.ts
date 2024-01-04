export const isNonNullable = <T extends object>(value?: T | null): value is NonNullable<T> => {
	if (value === null) {
		return false;
	}
	if (value === undefined) {
		return false;
	}
	return true;
};
