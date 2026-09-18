import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = fileURLToPath(new URL('sapphire-bootstrap.js', import.meta.url));
const workflowPath = join('.github', 'workflows', 'utils-update.yml');
const prettierignoreTemplate = readFileSync(
	fileURLToPath(new URL('../templates/prettierignore.template', import.meta.url)),
	'utf-8',
);
const prettierignoreSection = `# @sapphire-sh/utils:start\n${prettierignoreTemplate}# @sapphire-sh/utils:end`;

const projects: string[] = [];

const createProject = () => {
	const project = mkdtempSync(join(tmpdir(), 'sapphire-bootstrap-'));
	projects.push(project);
	return project;
};

const runBootstrap = (cwd: string) => execFileSync(process.execPath, [scriptPath], { cwd, encoding: 'utf-8' });

afterEach(() => {
	for (const project of projects.splice(0)) {
		rmSync(project, { recursive: true, force: true });
	}
});

describe('sapphire-bootstrap', () => {
	it('copies the utils update workflow when the target does not have one', () => {
		const project = createProject();

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${workflowPath}`);
		expect(readFileSync(join(project, workflowPath), 'utf-8')).toContain('utils-update-template.yml');
	});

	it('keeps an existing utils update workflow and reports it as skipped', () => {
		const project = createProject();
		const existing = 'name: utils-update\n\njobs:\n  update:\n    with:\n      rebuild_packages: example-package\n';
		mkdirSync(join(project, dirname(workflowPath)), { recursive: true });
		writeFileSync(join(project, workflowPath), existing);

		const output = runBootstrap(project);

		expect(output).toContain(`skipped ${workflowPath}`);
		expect(output).not.toContain(`wrote ${workflowPath}`);
		expect(readFileSync(join(project, workflowPath), 'utf-8')).toBe(existing);
	});

	it('skips the utils update workflow when the target is utils itself', () => {
		const project = createProject();
		writeFileSync(join(project, 'package.json'), JSON.stringify({ name: '@sapphire-sh/utils' }));

		const output = runBootstrap(project);

		expect(output).toContain(`skipped ${workflowPath}`);
		expect(existsSync(join(project, workflowPath))).toBe(false);
	});

	it('replaces only the marked section of an existing .prettierignore', () => {
		const project = createProject();
		const existing = '# @sapphire-sh/utils:start\nstale\n# @sapphire-sh/utils:end\n\nmigrations/meta\n';
		writeFileSync(join(project, '.prettierignore'), existing);

		runBootstrap(project);

		expect(readFileSync(join(project, '.prettierignore'), 'utf-8')).toBe(
			`${prettierignoreSection}\n\nmigrations/meta\n`,
		);
	});

	it('prepends the marked section to an existing .prettierignore without markers', () => {
		const project = createProject();
		writeFileSync(join(project, '.prettierignore'), 'migrations/meta\n');

		runBootstrap(project);

		expect(readFileSync(join(project, '.prettierignore'), 'utf-8')).toBe(
			`${prettierignoreSection}\n\nmigrations/meta\n`,
		);
	});
});
