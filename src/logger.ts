export enum LogLevel {
	DEBUG = 1,
	INFO,
	WARN,
	ERROR,
}

type Payload = Record<string, unknown> | Error;

function serializePayload(payload: Payload): string {
	const json = JSON.stringify(
		payload instanceof Error ? { error: payload.message, name: payload.name, stack: payload.stack } : payload,
	);
	return json.padStart(json.length + 1);
}

let currentLevel: LogLevel = LogLevel.INFO;

function log(level: LogLevel, message: string, payload?: Payload) {
	if (level < currentLevel) {
		return;
	}

	const ts = new Date().toISOString();
	const prefix = `[${ts}] [${LogLevel[level].toUpperCase()}]`;
	const payloadStr = payload === undefined ? '' : serializePayload(payload);
	const output = `${prefix} ${message}${payloadStr}`;

	if (level === LogLevel.ERROR) {
		console.error(output);
	} else if (level === LogLevel.WARN) {
		console.warn(output);
	} else if (level === LogLevel.DEBUG) {
		console.debug(output);
	} else {
		console.log(output);
	}
}

export const logger = {
	debug: (message: string, payload?: Payload) => log(LogLevel.DEBUG, message, payload),
	info: (message: string, payload?: Payload) => log(LogLevel.INFO, message, payload),
	warn: (message: string, payload?: Payload) => log(LogLevel.WARN, message, payload),
	error: (message: string, payload?: Payload) => log(LogLevel.ERROR, message, payload),
	setLevel: (level: LogLevel | string) => {
		if (typeof level === 'string') {
			const resolved = LogLevel[level.toUpperCase() as keyof typeof LogLevel];
			if (resolved === undefined) {
				console.warn(`[logger] Invalid log level: "${level}", keeping current level`);
				return;
			}
			currentLevel = resolved;
		} else {
			currentLevel = level;
		}
	},
};
