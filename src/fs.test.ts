import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fileExists, mkdir } from './fs';

const { lstatMock, mkdirMock } = vi.hoisted(() => ({
	lstatMock: vi.fn(),
	mkdirMock: vi.fn(),
}));

vi.mock('node:fs', () => ({
	default: {
		promises: {
			lstat: lstatMock,
			mkdir: mkdirMock,
		},
	},
}));

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
