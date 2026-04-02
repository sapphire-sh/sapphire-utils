import zlib from 'node:zlib';
import { promisify } from 'node:util';

const deflate = promisify(zlib.deflate);
const inflate = promisify(zlib.inflate);

export const compress = async <T>(data: T): Promise<Buffer> => {
	return deflate(Buffer.from(JSON.stringify(data)));
};

export const decompress = async <T>(data: Buffer): Promise<T> => {
	const result = await inflate(data);
	return JSON.parse(result.toString()) as T;
};
