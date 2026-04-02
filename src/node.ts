import fs from 'node:fs';

export const mkdir = async (path: string): Promise<void> => {
	try {
		await fs.promises.lstat(path);
	} catch (error) {
		if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
			await fs.promises.mkdir(path, { recursive: true });
		} else {
			throw error;
		}
	}
};
