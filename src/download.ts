import fs from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { HttpError } from './http.js';

// fetch hands back the global ReadableStream, which Readable.fromWeb does not accept,
// so the body is drained through its reader instead.
const readChunks = async function* (body: NonNullable<Response['body']>): AsyncGenerator<Uint8Array> {
	const reader = body.getReader();
	try {
		for (;;) {
			const result = await reader.read();
			if (result.done) {
				return;
			}
			yield result.value;
		}
	} finally {
		reader.releaseLock();
	}
};

export const download = async (
	url: string,
	filePath: string,
	init?: RequestInit,
	timeoutMs = 5 * 60 * 1000,
): Promise<number> => {
	const resp = await fetch(url, {
		signal: AbortSignal.timeout(timeoutMs),
		...init,
	});
	if (!resp.ok) {
		throw new HttpError(resp.status, resp.statusText);
	}
	if (resp.body === null) {
		throw new Error(`Response body is empty: ${url}`);
	}

	await pipeline(Readable.from(readChunks(resp.body)), fs.createWriteStream(filePath));

	const { size } = await fs.promises.stat(filePath);
	return size;
};
