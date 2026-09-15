const BYTES_PER_UNIT = 1024;
const BYTE_UNITS = ['KB', 'MB', 'GB', 'TB'];

export const formatBytes = (bytes: number): string => {
	if (bytes < BYTES_PER_UNIT) {
		return `${bytes} B`;
	}

	let value = bytes / BYTES_PER_UNIT;
	let unitIndex = 0;

	while (value >= BYTES_PER_UNIT && unitIndex < BYTE_UNITS.length - 1) {
		value /= BYTES_PER_UNIT;
		unitIndex += 1;
	}

	return `${value.toFixed(1)} ${BYTE_UNITS[unitIndex]}`;
};
