import { readEnv } from './env.js';

export enum LogLevel {
	DEBUG = 1,
	INFO,
	WARN,
	ERROR,
}

export interface LogEntry {
	level: LogLevel;
	message: string;
	payload?: unknown;
	timestamp: Temporal.Instant;
}

export type LogSink = (entry: LogEntry) => void;

const sinks: LogSink[] = [];

// JSON.stringify is typed as returning string, but returns undefined for values it cannot
// serialize, such as functions and symbols, and throws on circular structures and BigInt values.
const stringify = (value: unknown): string | undefined => JSON.stringify(value);

interface SerializedError {
	[key: string]: unknown;
	error: string;
	name: string;
	stack?: string;
	cause?: unknown;
}

const SERIALIZED_ERROR_KEYS = new Set(['error', 'name', 'stack', 'cause']);

const serializeCause = (cause: unknown, path: readonly Error[]): unknown => {
	if (!(cause instanceof Error)) {
		return cause;
	}
	return path.includes(cause) ? '[circular]' : serializeError(cause, path);
};

const serializeError = (error: Error, ancestors: readonly Error[] = []): SerializedError => ({
	error: error.message,
	name: error.name,
	stack: error.stack,
	cause: serializeCause(error.cause, [...ancestors, error]),
	...Object.fromEntries(Object.entries(error).filter(([key]) => !SERIALIZED_ERROR_KEYS.has(key))),
});

const serializePayload = (payload: unknown): string => {
	let serialized: string | undefined;
	try {
		serialized = stringify(payload instanceof Error ? serializeError(payload) : payload);
	} catch {
		serialized = '"[unserializable]"';
	}
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

const log = (level: LogLevel, message: string, payload?: unknown) => {
	if (level < currentLevel) {
		return;
	}

	const timestamp = Temporal.Now.instant();
	const prefix = `[${timestamp.toString({ smallestUnit: 'millisecond' })}] [${LogLevel[level].toUpperCase()}]`;
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
	debug: (message: string, payload?: unknown) => log(LogLevel.DEBUG, message, payload),
	info: (message: string, payload?: unknown) => log(LogLevel.INFO, message, payload),
	warn: (message: string, payload?: unknown) => log(LogLevel.WARN, message, payload),
	error: (message: string, payload?: unknown) => log(LogLevel.ERROR, message, payload),
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
