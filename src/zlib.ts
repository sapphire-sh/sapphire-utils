import { promisify } from 'node:util';
import zlib from 'node:zlib';

const deflate = promisify(zlib.deflate);
const inflate = promisify(zlib.inflate);

export const compress = async <T>(data: T): Promise<Buffer> => {
	const result = await deflate(Buffer.from(JSON.stringify(data)));
	return result;
};

export const decompress = async <T>(data: Buffer): Promise<T> => {
	const result = await inflate(data);
	return JSON.parse(result.toString());
};
