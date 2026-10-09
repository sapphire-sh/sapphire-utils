#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const START_MARKER = '# @sapphire-sh/utils:start';
const END_MARKER = '# @sapphire-sh/utils:end';

const selfPackageName = '@sapphire-sh/utils';
const selfSkipped = new Set([join('.github', 'workflows', 'utils-update.yml')]);

const workflowsDir = join('.github', 'workflows');
const workflowValuesPath = join('.github', 'sapphire-workflows.json');
const withLinePattern = /^\s*with:\s*$/m;
const requiredFiles = new Map([[join(workflowsDir, 'docker-publish.yml'), 'Dockerfile']]);

const sectioned = new Set(['.gitignore', '.prettierignore']);
const renameMap = new Map([
	['editorconfig.template', '.editorconfig'],
	['gitignore.template', '.gitignore'],
	['prettierignore.template', '.prettierignore'],
]);

const templatesDir = join(fileURLToPath(import.meta.url), '..', '..', 'templates');
const cwd = process.cwd();

const readPackageName = () => {
	const filepath = join(cwd, 'package.json');

	if (existsSync(filepath) === false) {
		return null;
	}

	try {
		const parsed = JSON.parse(readFileSync(filepath, 'utf-8'));
		return typeof parsed.name === 'string' ? parsed.name : null;
	} catch {
		return null;
	}
};

const readWorkflowValues = () => {
	const filepath = join(cwd, workflowValuesPath);

	if (existsSync(filepath) === false) {
		return {};
	}

	return JSON.parse(readFileSync(filepath, 'utf-8'));
};

const isSelf = readPackageName() === selfPackageName;
const workflowValues = readWorkflowValues();

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

const writeWorkflow = (outputName, template) => {
	const filepath = join(cwd, outputName);
	const values = workflowValues[basename(outputName, '.yml')];
	let content = template;

	if (values === undefined) {
		if (existsSync(filepath) && withLinePattern.test(readFileSync(filepath, 'utf-8'))) {
			console.log(`warning: ${outputName} had with: values that are not in ${workflowValuesPath}`);
		}
	} else {
		if (withLinePattern.test(template) === false) {
			content += '    with:\n';
		}

		for (const [key, value] of Object.entries(values)) {
			content += `      ${key}: ${JSON.stringify(value)}\n`;
		}
	}

	mkdirSync(dirname(filepath), { recursive: true });
	writeFileSync(filepath, content);
	console.log(`wrote ${outputName}`);
};

const collectTemplates = (directory, prefix) => {
	const relativePaths = [];

	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const relativePath = prefix === '' ? entry.name : join(prefix, entry.name);

		if (entry.isDirectory()) {
			relativePaths.push(...collectTemplates(join(directory, entry.name), relativePath));
		} else {
			relativePaths.push(relativePath);
		}
	}

	return relativePaths;
};

for (const relativePath of collectTemplates(templatesDir, '')) {
	const outputName = renameMap.get(relativePath) ?? relativePath;
	const outputPath = join(cwd, outputName);

	if (isSelf && selfSkipped.has(outputName)) {
		console.log(`skipped ${outputName}`);
		continue;
	}

	if (requiredFiles.has(outputName) && existsSync(join(cwd, requiredFiles.get(outputName))) === false) {
		console.log(`skipped ${outputName}`);
		continue;
	}

	if (dirname(outputName) === workflowsDir) {
		writeWorkflow(outputName, readFileSync(join(templatesDir, relativePath), 'utf-8'));
	} else if (sectioned.has(outputName)) {
		const content = readFileSync(join(templatesDir, relativePath), 'utf-8');
		writeSectioned(outputName, content);
	} else {
		mkdirSync(dirname(outputPath), { recursive: true });
		copyFileSync(join(templatesDir, relativePath), outputPath);
		console.log(`wrote ${outputName}`);
	}
}
