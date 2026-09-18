export const toLocalISOString = (instant: Temporal.Instant): string =>
	instant
		.toZonedDateTimeISO(Temporal.Now.timeZoneId())
		.toString({ smallestUnit: 'millisecond', timeZoneName: 'never' });

export const formatDate = (instant: Temporal.Instant, timeZone?: string): string =>
	instant
		.toZonedDateTimeISO(timeZone ?? Temporal.Now.timeZoneId())
		.toPlainDate()
		.toString();

export const formatDuration = (ms: number): string => {
	if (ms < 1000) {
		return `${ms}ms`;
	}
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
