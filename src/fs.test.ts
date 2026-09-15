import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fileExists, mkdir, readJson, writeJson } from './fs';

const { lstatMock, mkdirMock } = vi.hoisted(() => ({
	lstatMock: vi.fn(),
	mkdirMock: vi.fn(),
}));

// lstat and mkdir are mocked so their error branches can be driven directly;
// the remaining fs.promises members stay real so the JSON helpers hit the disk.
vi.mock('node:fs', async () => {
	const promises = await import('node:fs/promises');
	return {
		default: {
			promises: {
				...promises,
				lstat: lstatMock,
				mkdir: mkdirMock,
			},
		},
	};
});

const path = '/tmp/sapphire-utils-test';

const notFoundError = Object.assign(new Error('no such file or directory'), { code: 'ENOENT' });
const permissionError = Object.assign(new Error('permission denied'), { code: 'EACCES' });

describe('fileExists', () => {
	beforeEach(() => {
		lstatMock.mockReset();
		mkdirMock.mockReset();
	});

	it('returns true when the path can be stat-ed', async () => {
		lstatMock.mockResolvedValue({});

		await expect(fileExists(path)).resolves.toBe(true);
		expect(lstatMock).toHaveBeenCalledWith(path);
	});

	it('returns false when the path does not exist', async () => {
		lstatMock.mockRejectedValue(notFoundError);

		await expect(fileExists(path)).resolves.toBe(false);
	});

	it('rethrows errors other than ENOENT', async () => {
		lstatMock.mockRejectedValue(permissionError);

		await expect(fileExists(path)).rejects.toBe(permissionError);
	});
});

describe('mkdir', () => {
	beforeEach(() => {
		lstatMock.mockReset();
		mkdirMock.mockReset();
	});

	it('does nothing when the path already exists', async () => {
		lstatMock.mockResolvedValue({});

		await mkdir(path);

		expect(mkdirMock).not.toHaveBeenCalled();
	});

	it('creates the directory recursively when it does not exist', async () => {
		lstatMock.mockRejectedValue(notFoundError);
		mkdirMock.mockResolvedValue(undefined);

		await mkdir(path);

		expect(mkdirMock).toHaveBeenCalledWith(path, { recursive: true });
	});

	it('propagates errors other than ENOENT without creating anything', async () => {
		lstatMock.mockRejectedValue(permissionError);

		await expect(mkdir(path)).rejects.toBe(permissionError);
		expect(mkdirMock).not.toHaveBeenCalled();
	});
});

describe('readJson and writeJson', () => {
	let directory = '';

	beforeAll(async () => {
		directory = await mkdtemp(join(tmpdir(), 'sapphire-utils-'));
	});

	afterAll(async () => {
		await rm(directory, { recursive: true, force: true });
	});

	it('round trips a value through a file', async () => {
		const filePath = join(directory, 'round-trip.json');
		const data = { name: 'sapphire', tags: ['a', 'b'], nested: { count: 2 } };

		await writeJson(filePath, data);

		await expect(readJson(filePath)).resolves.toEqual(data);
	});

	it('writes two-space indentation and a trailing newline', async () => {
		const filePath = join(directory, 'formatted.json');

		await writeJson(filePath, { a: 1, b: [2] });

		await expect(readFile(filePath, 'utf-8')).resolves.toBe('{\n  "a": 1,\n  "b": [\n    2\n  ]\n}\n');
	});

	it('rejects when the file holds invalid JSON', async () => {
		const filePath = join(directory, 'invalid.json');
		await writeFile(filePath, '{ not json');

		await expect(readJson(filePath)).rejects.toThrow();
	});
});
