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
