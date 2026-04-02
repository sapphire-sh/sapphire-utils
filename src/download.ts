import fs from 'node:fs';
import { HttpError } from './http.js';

export const download = async (
	url: string,
	filePath: string,
	init?: RequestInit,
	timeoutMs = 5 * 60 * 1000,
): Promise<void> => {
	const resp = await fetch(url, {
		signal: AbortSignal.timeout(timeoutMs),
		...init,
	});
	if (!resp.ok) {
		throw new HttpError(resp.status, resp.statusText);
	}
	const buffer = await resp.arrayBuffer();
	await fs.promises.writeFile(filePath, Buffer.from(buffer));
};
