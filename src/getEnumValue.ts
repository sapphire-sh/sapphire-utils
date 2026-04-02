export const getEnumValue = <TEnum extends string>(value: Record<string, TEnum>) => {
	const enumValues = Object.values(value);
	return (input?: string): TEnum | null => enumValues.find((e) => e === input) ?? null;
};
