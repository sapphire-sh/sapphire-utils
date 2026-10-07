import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = fileURLToPath(new URL('sapphire-bootstrap.js', import.meta.url));
const utilsUpdateWorkflowPath = join('.github', 'workflows', 'utils-update.yml');
const npmAuditFixWorkflowPath = join('.github', 'workflows', 'npm-audit-fix.yml');
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

		expect(output).toContain(`wrote ${utilsUpdateWorkflowPath}`);
		expect(readFileSync(join(project, utilsUpdateWorkflowPath), 'utf-8')).toContain('utils-update-template.yml');
	});

	it('keeps an existing utils update workflow and reports it as skipped', () => {
		const project = createProject();
		const existing = 'name: utils-update\n\njobs:\n  update:\n    with:\n      rebuild_packages: example-package\n';
		mkdirSync(join(project, dirname(utilsUpdateWorkflowPath)), { recursive: true });
		writeFileSync(join(project, utilsUpdateWorkflowPath), existing);

		const output = runBootstrap(project);

		expect(output).toContain(`skipped ${utilsUpdateWorkflowPath}`);
		expect(output).not.toContain(`wrote ${utilsUpdateWorkflowPath}`);
		expect(readFileSync(join(project, utilsUpdateWorkflowPath), 'utf-8')).toBe(existing);
	});

	it('skips the utils update workflow when the target is utils itself', () => {
		const project = createProject();
		writeFileSync(join(project, 'package.json'), JSON.stringify({ name: '@sapphire-sh/utils' }));

		const output = runBootstrap(project);

		expect(output).toContain(`skipped ${utilsUpdateWorkflowPath}`);
		expect(existsSync(join(project, utilsUpdateWorkflowPath))).toBe(false);
	});

	it('copies the npm audit fix workflow when the target does not have one', () => {
		const project = createProject();

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${npmAuditFixWorkflowPath}`);
		expect(readFileSync(join(project, npmAuditFixWorkflowPath), 'utf-8')).toContain('npm-audit-fix-template.yml');
	});

	it('keeps an existing npm audit fix workflow and reports it as skipped', () => {
		const project = createProject();
		const existing = 'name: npm-audit-fix\n\njobs:\n  fix:\n    with:\n      rebuild_packages: example-package\n';
		mkdirSync(join(project, dirname(npmAuditFixWorkflowPath)), { recursive: true });
		writeFileSync(join(project, npmAuditFixWorkflowPath), existing);

		const output = runBootstrap(project);

		expect(output).toContain(`skipped ${npmAuditFixWorkflowPath}`);
		expect(output).not.toContain(`wrote ${npmAuditFixWorkflowPath}`);
		expect(readFileSync(join(project, npmAuditFixWorkflowPath), 'utf-8')).toBe(existing);
	});

	it('copies the npm audit fix workflow when the target is utils itself', () => {
		const project = createProject();
		writeFileSync(join(project, 'package.json'), JSON.stringify({ name: '@sapphire-sh/utils' }));

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${npmAuditFixWorkflowPath}`);
		expect(readFileSync(join(project, npmAuditFixWorkflowPath), 'utf-8')).toContain('npm-audit-fix-template.yml');
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
