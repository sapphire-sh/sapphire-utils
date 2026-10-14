#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const START_MARKER = '# @sapphire-sh/utils:start';
const END_MARKER = '# @sapphire-sh/utils:end';

const selfPackageName = '@sapphire-sh/utils';
const selfSkipped = new Set([
	join('.github', 'workflows', 'node-shared-config-update.yml'),
	join('.github', 'workflows', 'node-verify.yml'),
]);
const obsoleteFiles = new Set([
	join('.github', 'workflows', 'utils-update.yml'),
	join('.github', 'workflows', 'npm-audit-fix.yml'),
	join('.github', 'workflows', 'shared-config-update.yml'),
]);

const workflowsDir = join('.github', 'workflows');
const workflowValuesPath = join('.github', 'sapphire-workflows.json');
const withLinePattern = /^\s*with:\s*$/m;
const pathsIgnoreLinePattern = /^\s*paths-ignore:\s*$/m;
const pushBlockPattern = /^on:\n(?:[ \t].*\n|\n)*? {2}push:\n((?: {4}.*\n|\n)*)/m;
const branchesListPattern = /^ {2}push:\n {4}branches:\n(?: {6}- .*\n)*/m;
const entryKeys = new Set(['push', 'with']);
const pushKeys = new Set(['paths', 'paths-ignore']);
const requiredFiles = new Map([[join(workflowsDir, 'docker-publish.yml'), 'Dockerfile']]);
const entryRequiredFiles = new Set([join(workflowsDir, 'userscript-publish.yml')]);
const entryExcludedFiles = new Map([[join(workflowsDir, 'node-verify.yml'), 'userscript-publish']]);

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

const codeOwnersPath = join('.github', 'CODEOWNERS');

const readCodeOwnerUsers = () => {
	const filepath = join(cwd, codeOwnersPath);

	if (existsSync(filepath) === false) {
		return [];
	}

	let assignees = [];

	for (const line of readFileSync(filepath, 'utf-8').split('\n')) {
		const tokens = line.trim().split(/\s+/);
		const commentIndex = tokens.findIndex((token) => token.startsWith('#'));
		const [pattern, ...owners] = commentIndex === -1 ? tokens : tokens.slice(0, commentIndex);

		if (pattern === '*') {
			assignees = owners
				.filter((owner) => owner.startsWith('@') && owner.includes('/') === false)
				.map((owner) => owner.slice(1));
		}
	}

	return assignees;
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

const formatYamlValue = (value) =>
	typeof value === 'string' && value.includes("'") === false ? `'${value}'` : JSON.stringify(value);

const readWithLines = (content) => {
	const withLine = withLinePattern.exec(content);

	return withLine === null
		? []
		: content
				.slice(withLine.index + withLine[0].length)
				.split('\n')
				.filter((line) => line !== '');
};

const writeWorkflow = (outputName, template) => {
	const filepath = join(cwd, outputName);
	const values = workflowValues[basename(outputName, '.yml')];
	let content = template;

	if (values !== undefined) {
		const { push = {}, with: withValues } = values;

		for (const [key, patterns] of Object.entries(push)) {
			const patternLines = patterns.map((value) => `      - ${formatYamlValue(value)}\n`).join('');
			content = content.replace(branchesListPattern, (branchesList) => `${branchesList}    ${key}:\n${patternLines}`);
		}

		if (withValues !== undefined) {
			if (withLinePattern.test(template) === false) {
				content += '    with:\n';
			}

			for (const [key, value] of Object.entries(withValues)) {
				content += `      ${key}: ${formatYamlValue(value)}\n`;
			}
		}
	}

	if (basename(outputName, '.yml') === 'dependabot-review-request') {
		const reviewers = readCodeOwnerUsers();

		if (reviewers.length > 0) {
			if (withLinePattern.test(content) === false) {
				content += '    with:\n';
			}

			content += `      reviewers: ${formatYamlValue(reviewers.join(' '))}\n`;
		}
	}

	if (values === undefined && existsSync(filepath)) {
		const contentWithLines = new Set(readWithLines(content));

		if (readWithLines(readFileSync(filepath, 'utf-8')).some((line) => contentWithLines.has(line) === false) === true) {
			console.log(`warning: ${outputName} had with: values that are not in ${workflowValuesPath}`);
		}
	}

	if (
		(values?.push === undefined || Object.hasOwn(values.push, 'paths-ignore') === false) &&
		existsSync(filepath) &&
		pathsIgnoreLinePattern.test(readFileSync(filepath, 'utf-8'))
	) {
		console.log(`warning: ${outputName} had paths-ignore values that are not in ${workflowValuesPath}`);
	}

	mkdirSync(dirname(filepath), { recursive: true });
	writeFileSync(filepath, content);
	console.log(`wrote ${outputName}`);
};

const writeDependabotConfig = (outputName, template) => {
	const filepath = join(cwd, outputName);
	const manifestDirectories = [];
	const trackedFiles = spawnSync('git', ['ls-files', '-z'], { cwd, encoding: 'utf-8' });

	if (trackedFiles.status === 0) {
		for (const path of trackedFiles.stdout.split('\0')) {
			if (basename(path) === 'package.json' && dirname(path) !== '.') {
				manifestDirectories.push(`/${dirname(path)}`);
			}
		}
	} else {
		const pendingDirectories = [''];

		while (pendingDirectories.length > 0) {
			const relativeDirectory = pendingDirectories.pop();

			for (const entry of readdirSync(join(cwd, relativeDirectory), { withFileTypes: true })) {
				if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
					pendingDirectories.push(relativeDirectory === '' ? entry.name : `${relativeDirectory}/${entry.name}`);
				} else if (entry.isFile() && entry.name === 'package.json' && relativeDirectory !== '') {
					manifestDirectories.push(`/${relativeDirectory}`);
				}
			}
		}
	}

	let content = template;

	if (manifestDirectories.length > 0) {
		const directoryLines = ['/', ...manifestDirectories]
			.toSorted()
			.map((directory) => `      - ${formatYamlValue(directory)}\n`)
			.join('');
		content = template.replace(
			'  - package-ecosystem: npm\n    directory: /\n',
			`  - package-ecosystem: npm\n    directories:\n${directoryLines}`,
		);
	}

	const assignees = readCodeOwnerUsers();

	if (assignees.length > 0) {
		const assigneeLines = assignees.map((assignee) => `      - ${formatYamlValue(assignee)}\n`).join('');
		content = content
			.split(/(?=^ {2}- package-ecosystem: )/m)
			.map((entry) =>
				entry.startsWith('  - package-ecosystem: ') === true ? `${entry}    assignees:\n${assigneeLines}` : entry,
			)
			.join('');
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

for (const [name, values] of Object.entries(workflowValues)) {
	const callerPath = join(workflowsDir, `${name}.yml`);

	if (existsSync(join(templatesDir, callerPath)) === false) {
		console.error(`error: ${workflowValuesPath} ${name} names no workflow template`);
		process.exit(1);
	}

	for (const key of Object.keys(values)) {
		if (entryKeys.has(key) === false) {
			console.error(`error: ${workflowValuesPath} ${name} has unknown key ${key}`);
			process.exit(1);
		}
	}

	if (name === 'userscript-publish' && values.with?.assets === undefined) {
		console.error(`error: ${workflowValuesPath} userscript-publish has no with.assets`);
		process.exit(1);
	}

	if (values.push === undefined) {
		continue;
	}

	for (const key of Object.keys(values.push)) {
		if (pushKeys.has(key) === false) {
			console.error(`error: ${workflowValuesPath} ${name}.push has unknown key ${key}`);
			process.exit(1);
		}
	}

	if (Object.hasOwn(values.push, 'paths') && Object.hasOwn(values.push, 'paths-ignore')) {
		console.error(`error: ${workflowValuesPath} ${name}.push sets both paths and paths-ignore`);
		process.exit(1);
	}

	if (Object.keys(values.push).length === 0) {
		continue;
	}

	const [pushKey] = Object.keys(values.push);
	const pushBlock = pushBlockPattern.exec(readFileSync(join(templatesDir, callerPath), 'utf-8'));

	if (pushBlock === null || /^ {4}paths:/m.test(pushBlock[1])) {
		console.error(
			`error: ${workflowValuesPath} sets push.${pushKey} for ${callerPath}, whose template has no push trigger without paths`,
		);
		process.exit(1);
	}
}

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

	if (entryRequiredFiles.has(outputName) && Object.hasOwn(workflowValues, basename(outputName, '.yml')) === false) {
		console.log(`skipped ${outputName}`);
		continue;
	}

	if (entryExcludedFiles.has(outputName) && Object.hasOwn(workflowValues, entryExcludedFiles.get(outputName))) {
		console.log(`skipped ${outputName}`);
		continue;
	}

	if (dirname(outputName) === workflowsDir) {
		writeWorkflow(outputName, readFileSync(join(templatesDir, relativePath), 'utf-8'));
	} else if (outputName === join('.github', 'dependabot.yml')) {
		writeDependabotConfig(outputName, readFileSync(join(templatesDir, relativePath), 'utf-8'));
	} else if (sectioned.has(outputName)) {
		const content = readFileSync(join(templatesDir, relativePath), 'utf-8');
		writeSectioned(outputName, content);
	} else {
		mkdirSync(dirname(outputPath), { recursive: true });
		copyFileSync(join(templatesDir, relativePath), outputPath);
		console.log(`wrote ${outputName}`);
	}
}

for (const relativePath of obsoleteFiles) {
	const filepath = join(cwd, relativePath);

	if (existsSync(filepath)) {
		rmSync(filepath);
		console.log(`removed ${relativePath}`);
	}
}
