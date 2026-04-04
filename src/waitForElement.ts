import { isNonNullable } from './isNonNullable.js';
import { sleep } from './sleep.js';

const poll = async <T>(
	handler: () => T | null,
	options?: {
		timeout?: number;
		jitter?: number;
	},
): Promise<T | null> => {
	const { timeout = 10000, jitter = 0 } = options ?? {};
	let elapsedTime = 0;
	const intervalTime = 100;

	for (;;) {
		const result = handler();
		if (result !== null) {
			return result;
		}
		if (elapsedTime >= timeout) {
			return null;
		}
		await sleep(intervalTime, jitter);
		elapsedTime += intervalTime;
	}
};

export const waitForElement = async <T extends HTMLElement>(
	selector: string,
	options?: {
		parent?: ParentNode;
		timeout?: number;
		jitter?: number;
	},
): Promise<T[] | null> => {
	const root = options?.parent ?? document;
	return poll(() => {
		const elements = root.querySelectorAll<T>(selector);
		return elements.length > 0 ? Array.from(elements) : null;
	}, options);
};

export const waitForElements = async <T extends HTMLElement>(
	selector: string | string[],
	options?: {
		parent?: HTMLElement;
		timeout?: number;
		jitter?: number;
	},
): Promise<T[] | null> => {
	const root = options?.parent ?? document;
	const selectors = Array.isArray(selector) ? selector : [selector];
	return poll(() => {
		for (const selector of selectors) {
			const elements = root.querySelectorAll<T>(selector);
			if (elements.length > 0) {
				return Array.from(elements).filter(isNonNullable);
			}
		}
		return null;
	}, options);
};
