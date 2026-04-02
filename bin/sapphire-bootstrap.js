#!/usr/bin/env node

import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const START_MARKER = '# @sapphire-sh/utils:start';
const END_MARKER = '# @sapphire-sh/utils:end';

const sectioned = new Set(['.gitignore']);
const renameMap = new Map([
	['editorconfig.template', '.editorconfig'],
	['gitignore.template', '.gitignore'],
	['prettierignore.template', '.prettierignore'],
]);

const templatesDir = join(fileURLToPath(import.meta.url), '..', '..', 'templates');
const cwd = process.cwd();

const writeSectioned = (outputName, content) => {
	const filepath = join(cwd, outputName);
	const section = `${START_MARKER}\n${content}${END_MARKER}`;

	if (existsSync(filepath) === false) {
		writeFileSync(filepath, `${section}\n`);
		console.log(`wrote ${outputName}`);
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

	console.log(`wrote ${outputName}`);
};

for (const filename of readdirSync(templatesDir)) {
	const outputName = renameMap.get(filename) ?? filename;
	if (sectioned.has(outputName)) {
		const content = readFileSync(join(templatesDir, filename), 'utf-8');
		writeSectioned(outputName, content);
	} else {
		copyFileSync(join(templatesDir, filename), join(cwd, outputName));
		console.log(`wrote ${outputName}`);
	}
}
