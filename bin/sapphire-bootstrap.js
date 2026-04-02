#!/usr/bin/env node

import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const START_MARKER = '# @sapphire-sh/utils:start';
const END_MARKER = '# @sapphire-sh/utils:end';

const sectioned = new Set(['.gitignore']);

const templatesDir = join(fileURLToPath(import.meta.url), '..', '..', 'templates');
const cwd = process.cwd();

const writeSectioned = (filename, content) => {
	const filepath = join(cwd, filename);
	const section = `${START_MARKER}\n${content}${END_MARKER}`;

	if (existsSync(filepath) === false) {
		writeFileSync(filepath, `${section}\n`);
		console.log(`wrote ${filename}`);
		return;
	}

	const existing = readFileSync(filepath, 'utf-8');
	const startIndex = existing.indexOf(START_MARKER);
	const endIndex = existing.indexOf(END_MARKER);

	if (startIndex !== -1 && endIndex !== -1) {
		const before = existing.slice(0, startIndex);
		const after = existing.slice(endIndex + END_MARKER.length);
		writeFileSync(filepath, `${before}${section}${after}`);
	} else {
		writeFileSync(filepath, `${section}\n\n${existing}`);
	}

	console.log(`wrote ${filename}`);
};

for (const filename of readdirSync(templatesDir)) {
	if (sectioned.has(filename)) {
		const content = readFileSync(join(templatesDir, filename), 'utf-8');
		writeSectioned(filename, content);
	} else {
		copyFileSync(join(templatesDir, filename), join(cwd, filename));
		console.log(`wrote ${filename}`);
	}
}
