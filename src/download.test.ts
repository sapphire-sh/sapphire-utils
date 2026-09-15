import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { download } from './download';
import { HttpError } from './http';

const url = 'https://example.test/file.bin';

describe('download', () => {
	let directory = '';

	beforeAll(async () => {
		directory = await mkdtemp(join(tmpdir(), 'sapphire-utils-'));
	});

	afterAll(async () => {
		await rm(directory, { recursive: true, force: true });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('streams the response body into the file and returns its size', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('hello world'));
		const filePath = join(directory, 'body.txt');

		await expect(download(url, filePath)).resolves.toBe(11);
		await expect(readFile(filePath, 'utf-8')).resolves.toBe('hello world');
	});

	it('writes every chunk of a multi-chunk body', async () => {
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(new TextEncoder().encode('first '));
				controller.enqueue(new TextEncoder().encode('second'));
				controller.close();
			},
		});
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body));
		const filePath = join(directory, 'chunked.txt');

		await expect(download(url, filePath)).resolves.toBe(12);
		await expect(readFile(filePath, 'utf-8')).resolves.toBe('first second');
	});

	it('throws an HttpError when the response is not ok', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404, statusText: 'Not Found' }));

		await expect(download(url, join(directory, 'missing.txt'))).rejects.toThrow(HttpError);
	});

	it('throws when the response has no body', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));

		await expect(download(url, join(directory, 'empty.txt'))).rejects.toThrow('Response body is empty');
	});
});
