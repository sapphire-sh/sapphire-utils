import { readEnv } from './env.js';

export enum LogLevel {
	DEBUG = 1,
	INFO,
	WARN,
	ERROR,
}

type Payload = unknown;

export interface LogEntry {
	level: LogLevel;
	message: string;
	payload?: unknown;
	timestamp: Date;
}

export type LogSink = (entry: LogEntry) => void;

const sinks: LogSink[] = [];

// JSON.stringify is typed as returning string, but returns undefined for values it cannot
// serialize, such as functions and symbols.
const stringify = (value: unknown): string | undefined => JSON.stringify(value);

const serializePayload = (payload: Payload): string => {
	const serialized = stringify(
		payload instanceof Error ? { error: payload.message, name: payload.name, stack: payload.stack } : payload,
	);
	const json = serialized ?? `"[${typeof payload}]"`;
	return json.padStart(json.length + 1);
};

const levelMap: Record<string, LogLevel | undefined> = {
	DEBUG: LogLevel.DEBUG,
	INFO: LogLevel.INFO,
	WARN: LogLevel.WARN,
	ERROR: LogLevel.ERROR,
};

const parseLevel = (level: string): LogLevel | undefined => levelMap[level.toUpperCase()];

const resolveInitialLevel = (): LogLevel => {
	const envLevel = readEnv('LOG_LEVEL');
	if (envLevel === undefined) {
		return LogLevel.INFO;
	}
	return parseLevel(envLevel) ?? LogLevel.INFO;
};

let currentLevel: LogLevel = resolveInitialLevel();

const log = (level: LogLevel, message: string, payload?: Payload) => {
	if (level < currentLevel) {
		return;
	}

	const timestamp = new Date();
	const prefix = `[${timestamp.toISOString()}] [${LogLevel[level].toUpperCase()}]`;
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

	for (const sink of sinks) {
		try {
			sink({ level, message, payload, timestamp });
		} catch (error) {
			console.error('[logger] sink failed', error);
		}
	}
};

export const logger = {
	debug: (message: string, payload?: Payload) => log(LogLevel.DEBUG, message, payload),
	info: (message: string, payload?: Payload) => log(LogLevel.INFO, message, payload),
	warn: (message: string, payload?: Payload) => log(LogLevel.WARN, message, payload),
	error: (message: string, payload?: Payload) => log(LogLevel.ERROR, message, payload),
	addSink: (sink: LogSink): (() => void) => {
		sinks.push(sink);
		return () => {
			const index = sinks.indexOf(sink);
			if (index !== -1) {
				sinks.splice(index, 1);
			}
		};
	},
	setLevel: (level: LogLevel | string) => {
		if (typeof level === 'string') {
			const resolved = parseLevel(level);
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
