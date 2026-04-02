export const toLocalISOString = (date: Date): string => {
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, '0');
	const day = `${date.getDate()}`.padStart(2, '0');
	const hours = `${date.getHours()}`.padStart(2, '0');
	const minutes = `${date.getMinutes()}`.padStart(2, '0');
	const seconds = `${date.getSeconds()}`.padStart(2, '0');
	const ms = `${date.getMilliseconds()}`.padStart(3, '0');

	const offset = date.getTimezoneOffset();
	const sign = offset <= 0 ? '+' : '-';
	const offsetHours = `${Math.floor(Math.abs(offset) / 60)}`.padStart(2, '0');
	const offsetMinutes = `${Math.abs(offset) % 60}`.padStart(2, '0');

	return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}${sign}${offsetHours}:${offsetMinutes}`;
};

export const formatDuration = (ms: number): string => {
	const totalSeconds = Math.ceil(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const parts: string[] = [];
	if (hours > 0) {
		parts.push(`${hours}h`);
	}
	if (minutes > 0) {
		parts.push(`${minutes}m`);
	}
	if (seconds > 0 || parts.length === 0) {
		parts.push(`${seconds}s`);
	}
	return parts.join(' ');
};
