import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = fileURLToPath(new URL('sapphire-bootstrap.js', import.meta.url));
const utilsUpdateWorkflowPath = join('.github', 'workflows', 'utils-update.yml');
const npmAuditFixWorkflowPath = join('.github', 'workflows', 'npm-audit-fix.yml');
const workflowValuesPath = join('.github', 'sapphire-workflows.json');
const utilsUpdateTemplate = readFileSync(
	fileURLToPath(new URL('../templates/.github/workflows/utils-update.yml', import.meta.url)),
	'utf-8',
);
const npmAuditFixTemplate = readFileSync(
	fileURLToPath(new URL('../templates/.github/workflows/npm-audit-fix.yml', import.meta.url)),
	'utf-8',
);
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

	it('overwrites an existing utils update workflow with the template', () => {
		const project = createProject();
		const existing = 'name: utils-update\n\njobs:\n  update:\n    with:\n      rebuild_packages: example-package\n';
		mkdirSync(join(project, dirname(utilsUpdateWorkflowPath)), { recursive: true });
		writeFileSync(join(project, utilsUpdateWorkflowPath), existing);

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${utilsUpdateWorkflowPath}`);
		expect(output).not.toContain(`skipped ${utilsUpdateWorkflowPath}`);
		expect(readFileSync(join(project, utilsUpdateWorkflowPath), 'utf-8')).toBe(utilsUpdateTemplate);
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

	it('overwrites an existing npm audit fix workflow with the template', () => {
		const project = createProject();
		const existing = 'name: npm-audit-fix\n\njobs:\n  fix:\n    with:\n      rebuild_packages: example-package\n';
		mkdirSync(join(project, dirname(npmAuditFixWorkflowPath)), { recursive: true });
		writeFileSync(join(project, npmAuditFixWorkflowPath), existing);

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${npmAuditFixWorkflowPath}`);
		expect(output).not.toContain(`skipped ${npmAuditFixWorkflowPath}`);
		expect(readFileSync(join(project, npmAuditFixWorkflowPath), 'utf-8')).toBe(npmAuditFixTemplate);
	});

	it('appends the values from .github/sapphire-workflows.json as a with: block', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'utils-update': { run_tests: true, rebuild_packages: 'example-package' } }),
		);

		runBootstrap(project);

		expect(readFileSync(join(project, utilsUpdateWorkflowPath), 'utf-8')).toBe(
			`${utilsUpdateTemplate}    with:\n      run_tests: true\n      rebuild_packages: "example-package"\n`,
		);
		expect(readFileSync(join(project, npmAuditFixWorkflowPath), 'utf-8')).toBe(npmAuditFixTemplate);
	});

	it('warns and overwrites when an existing caller has with: values the JSON file lacks', () => {
		const project = createProject();
		mkdirSync(join(project, dirname(utilsUpdateWorkflowPath)), { recursive: true });
		writeFileSync(
			join(project, utilsUpdateWorkflowPath),
			'name: utils-update\n\njobs:\n  update:\n    with:\n      rebuild_packages: example-package\n',
		);
		writeFileSync(join(project, npmAuditFixWorkflowPath), 'name: npm-audit-fix\n\njobs:\n  fix:\n');

		const output = runBootstrap(project);

		expect(output.split('\n').filter((line) => line.startsWith('warning: '))).toEqual([
			`warning: ${utilsUpdateWorkflowPath} had with: values that are not in ${workflowValuesPath}`,
		]);
		expect(readFileSync(join(project, utilsUpdateWorkflowPath), 'utf-8')).toBe(utilsUpdateTemplate);
		expect(readFileSync(join(project, npmAuditFixWorkflowPath), 'utf-8')).toBe(npmAuditFixTemplate);
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
