import { isNonNullable } from './isNonNullable.js';
import { sleep } from './sleep.js';

export const waitForElement = async (selector: string, timeout = 10000) => {
	let elapsedTime = 0;
	const intervalTime = 100;

	for (;;) {
		const e = document.querySelectorAll(selector);
		if (e.length > 0) {
			return e;
		}
		if (elapsedTime >= timeout) {
			return null;
		}
		await sleep(intervalTime);
		elapsedTime += intervalTime;
	}
};

export const waitForElements = async <T extends HTMLElement>(
	selector: string | string[],
	options?: {
		parent?: HTMLElement;
		timeout?: number;
	},
): Promise<T[] | null> => {
	const { parent, timeout = 10000 } = options ?? {};

	const root = parent ?? document;

	let elapsedTime = 0;
	const intervalTime = 100;

	for (;;) {
		if (elapsedTime >= timeout) {
			return null;
		}

		const selectors = Array.isArray(selector) ? selector : [selector];
		for (const selector of selectors) {
			const elements = root.querySelectorAll(selector);
			if (elements.length > 0) {
				// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
				return Array.from(elements)
					.map((element) => (element instanceof HTMLElement ? element : null))
					.filter(isNonNullable) as unknown as T[];
			}
			await sleep(intervalTime);
			elapsedTime += intervalTime;
		}
	}
};
