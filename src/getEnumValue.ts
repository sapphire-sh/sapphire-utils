export const getEnumValue = <T extends string, TEnum extends string>(value: { [key in T]: TEnum }) => {
	const enumValues = Object.values(value);
	return (value?: string): TEnum | null => (enumValues.includes(value) ? (value as TEnum) : null);
};
