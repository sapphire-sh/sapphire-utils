import fs from 'node:fs';

export const fileExists = async (path: string): Promise<boolean> => {
	try {
		await fs.promises.lstat(path);
		return true;
	} catch (error) {
		if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
			return false;
		}
		throw error;
	}
};

export const mkdir = async (path: string): Promise<void> => {
	if (await fileExists(path)) {
		return;
	}
	await fs.promises.mkdir(path, { recursive: true });
};

export const readJson = async <T>(path: string): Promise<T> => {
	const text = await fs.promises.readFile(path, 'utf-8');
	const parsed: T = JSON.parse(text);
	return parsed;
};

export const writeJson = async (path: string, data: unknown): Promise<void> => {
	await fs.promises.writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
};
