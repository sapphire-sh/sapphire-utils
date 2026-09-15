import { logger } from './logger.js';
import { notifySlack } from './notify.js';

export interface SlackLogBatcherOptions {
	webhookUrl: string;
	flushIntervalMs?: number;
	maxChunkLength?: number;
}

export interface SlackLogBatcher {
	enqueue: (line: string) => void;
	flush: () => Promise<void>;
}

export const chunkLines = (lines: string[], maxLength: number): string[] => {
	const chunks: string[] = [];
	let current: string | null = null;

	for (const line of lines) {
		if (current === null) {
			current = line;
		} else if (current.length + 1 + line.length > maxLength) {
			chunks.push(current);
			current = line;
		} else {
			current = `${current}\n${line}`;
		}
	}

	if (current !== null) {
		chunks.push(current);
	}

	return chunks;
};

export const createSlackLogBatcher = (options: SlackLogBatcherOptions): SlackLogBatcher => {
	const { webhookUrl, flushIntervalMs = 4096, maxChunkLength = 16384 } = options;

	let queue: string[] = [];
	let timer: ReturnType<typeof globalThis.setTimeout> | null = null;

	const flush = async (): Promise<void> => {
		if (timer !== null) {
			globalThis.clearTimeout(timer);
			timer = null;
		}

		const lines = queue;
		queue = [];

		for (const chunk of chunkLines(lines, maxChunkLength)) {
			try {
				await notifySlack(webhookUrl, chunk);
			} catch (error) {
				logger.error(
					'[slackLogBatcher] failed to send a chunk',
					error instanceof Error ? error : { error: String(error) },
				);
			}
		}
	};

	const enqueue = (line: string) => {
		queue.push(line);
		timer ??= globalThis.setTimeout(() => void flush(), flushIntervalMs);
	};

	return { enqueue, flush };
};
