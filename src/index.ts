export const getEnumValue = <T extends string, TEnum extends string>(value: { [key in T]: TEnum }) => {
	const enumValues = Object.values(value);
	return (value?: string): TEnum | null => (enumValues.includes(value) ? (value as TEnum) : null);
};

export const isNonNullable = <T extends object>(value?: T | null): value is NonNullable<T> => {
	if (value === null) {
		return false;
	}
	if (value === undefined) {
		return false;
	}
	return true;
};

export const sleep = (ms: number): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};
