import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = fileURLToPath(new URL('sapphire-bootstrap.js', import.meta.url));
const sharedConfigUpdateWorkflowPath = join('.github', 'workflows', 'shared-config-update.yml');
const utilsUpdateWorkflowPath = join('.github', 'workflows', 'utils-update.yml');
const dependabotConfigPath = join('.github', 'dependabot.yml');
const npmAuditFixWorkflowPath = join('.github', 'workflows', 'npm-audit-fix.yml');
const dockerPublishWorkflowPath = join('.github', 'workflows', 'docker-publish.yml');
const workflowValuesPath = join('.github', 'sapphire-workflows.json');
const sharedConfigUpdateTemplate = readFileSync(
	fileURLToPath(new URL('../templates/.github/workflows/shared-config-update.yml', import.meta.url)),
	'utf-8',
);
const dependabotTemplate = readFileSync(
	fileURLToPath(new URL('../templates/.github/dependabot.yml', import.meta.url)),
	'utf-8',
);
const npmAuditFixTemplate = readFileSync(
	fileURLToPath(new URL('../templates/.github/workflows/npm-audit-fix.yml', import.meta.url)),
	'utf-8',
);
const dockerPublishTemplate = readFileSync(
	fileURLToPath(new URL('../templates/.github/workflows/docker-publish.yml', import.meta.url)),
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
	it('copies the shared config update workflow when the target does not have one', () => {
		const project = createProject();

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${sharedConfigUpdateWorkflowPath}`);
		expect(readFileSync(join(project, sharedConfigUpdateWorkflowPath), 'utf-8')).toBe(sharedConfigUpdateTemplate);
	});

	it('overwrites an existing shared config update workflow with the template', () => {
		const project = createProject();
		const existing =
			'name: shared-config-update\n\njobs:\n  update:\n    with:\n      rebuild_packages: example-package\n';
		mkdirSync(join(project, dirname(sharedConfigUpdateWorkflowPath)), { recursive: true });
		writeFileSync(join(project, sharedConfigUpdateWorkflowPath), existing);

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${sharedConfigUpdateWorkflowPath}`);
		expect(output).not.toContain(`skipped ${sharedConfigUpdateWorkflowPath}`);
		expect(readFileSync(join(project, sharedConfigUpdateWorkflowPath), 'utf-8')).toBe(sharedConfigUpdateTemplate);
	});

	it('skips the shared config update workflow when the target is utils itself', () => {
		const project = createProject();
		writeFileSync(join(project, 'package.json'), JSON.stringify({ name: '@sapphire-sh/utils' }));

		const output = runBootstrap(project);

		expect(output).toContain(`skipped ${sharedConfigUpdateWorkflowPath}`);
		expect(existsSync(join(project, sharedConfigUpdateWorkflowPath))).toBe(false);
	});

	it('copies the dependabot config when the target does not have one', () => {
		const project = createProject();

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${dependabotConfigPath}`);
		expect(readFileSync(join(project, dependabotConfigPath), 'utf-8')).toBe(dependabotTemplate);
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
			JSON.stringify({ 'shared-config-update': { run_tests: true, rebuild_packages: 'example-package' } }),
		);

		runBootstrap(project);

		expect(readFileSync(join(project, sharedConfigUpdateWorkflowPath), 'utf-8')).toBe(
			`${sharedConfigUpdateTemplate}    with:\n      run_tests: true\n      rebuild_packages: 'example-package'\n`,
		);
		expect(readFileSync(join(project, npmAuditFixWorkflowPath), 'utf-8')).toBe(npmAuditFixTemplate);
	});

	it('writes a with: value containing a single quote in JSON notation', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(join(project, workflowValuesPath), JSON.stringify({ 'shared-config-update': { key: "it's" } }));

		runBootstrap(project);

		expect(readFileSync(join(project, sharedConfigUpdateWorkflowPath), 'utf-8')).toBe(
			`${sharedConfigUpdateTemplate}    with:\n      key: "it's"\n`,
		);
	});

	it('warns and overwrites when an existing caller has with: values the JSON file lacks', () => {
		const project = createProject();
		mkdirSync(join(project, dirname(sharedConfigUpdateWorkflowPath)), { recursive: true });
		writeFileSync(
			join(project, sharedConfigUpdateWorkflowPath),
			'name: shared-config-update\n\njobs:\n  update:\n    with:\n      rebuild_packages: example-package\n',
		);
		writeFileSync(join(project, npmAuditFixWorkflowPath), 'name: npm-audit-fix\n\njobs:\n  fix:\n');

		const output = runBootstrap(project);

		expect(output.split('\n').filter((line) => line.startsWith('warning: '))).toEqual([
			`warning: ${sharedConfigUpdateWorkflowPath} had with: values that are not in ${workflowValuesPath}`,
		]);
		expect(readFileSync(join(project, sharedConfigUpdateWorkflowPath), 'utf-8')).toBe(sharedConfigUpdateTemplate);
		expect(readFileSync(join(project, npmAuditFixWorkflowPath), 'utf-8')).toBe(npmAuditFixTemplate);
	});

	it('removes an obsolete utils update workflow from the target', () => {
		const project = createProject();
		mkdirSync(join(project, dirname(utilsUpdateWorkflowPath)), { recursive: true });
		writeFileSync(join(project, utilsUpdateWorkflowPath), 'name: utils-update\n');

		const output = runBootstrap(project);

		expect(output.split('\n').filter((line) => line.startsWith('removed '))).toEqual([
			`removed ${utilsUpdateWorkflowPath}`,
		]);
		expect(existsSync(join(project, utilsUpdateWorkflowPath))).toBe(false);
		expect(readFileSync(join(project, sharedConfigUpdateWorkflowPath), 'utf-8')).toBe(sharedConfigUpdateTemplate);
	});

	it('prints no removed line when the target has no obsolete workflow', () => {
		const project = createProject();

		const output = runBootstrap(project);

		expect(output.split('\n').filter((line) => line.startsWith('removed '))).toEqual([]);
		expect(output).toContain(`wrote ${sharedConfigUpdateWorkflowPath}`);
	});

	it('copies the npm audit fix workflow when the target is utils itself', () => {
		const project = createProject();
		writeFileSync(join(project, 'package.json'), JSON.stringify({ name: '@sapphire-sh/utils' }));

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${npmAuditFixWorkflowPath}`);
		expect(readFileSync(join(project, npmAuditFixWorkflowPath), 'utf-8')).toContain('npm-audit-fix-template.yml');
	});

	it('writes the docker publish workflow when the target has a Dockerfile', () => {
		const project = createProject();
		writeFileSync(join(project, 'Dockerfile'), 'FROM node\n');

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${dockerPublishWorkflowPath}`);
		expect(readFileSync(join(project, dockerPublishWorkflowPath), 'utf-8')).toBe(dockerPublishTemplate);
	});

	it('skips the docker publish workflow when the target has no Dockerfile', () => {
		const project = createProject();

		const output = runBootstrap(project);

		expect(output).toContain(`skipped ${dockerPublishWorkflowPath}`);
		expect(existsSync(join(project, dockerPublishWorkflowPath))).toBe(false);
		expect(output).toContain(`wrote ${sharedConfigUpdateWorkflowPath}`);
		expect(readFileSync(join(project, sharedConfigUpdateWorkflowPath), 'utf-8')).toBe(sharedConfigUpdateTemplate);
	});

	it('appends the docker-publish values after the image_name line', () => {
		const project = createProject();
		writeFileSync(join(project, 'Dockerfile'), 'FROM node\n');
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'docker-publish': { platforms: 'linux/arm64', run_tests: true } }),
		);

		runBootstrap(project);

		expect(readFileSync(join(project, dockerPublishWorkflowPath), 'utf-8')).toBe(
			`${dockerPublishTemplate}      platforms: 'linux/arm64'\n      run_tests: true\n`,
		);
	});

	it('puts the docker-publish paths-ignore values after the branches list', () => {
		const project = createProject();
		writeFileSync(join(project, 'Dockerfile'), 'FROM node\n');
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({
				'docker-publish': { 'paths-ignore': ['**/*.md', 'example/**'], platforms: 'linux/arm64' },
			}),
		);

		runBootstrap(project);

		expect(readFileSync(join(project, dockerPublishWorkflowPath), 'utf-8')).toBe(
			`${dockerPublishTemplate.replace(
				'    branches:\n      - main\n',
				"    branches:\n      - main\n    paths-ignore:\n      - '**/*.md'\n      - 'example/**'\n",
			)}      platforms: 'linux/arm64'\n`,
		);
	});

	it('exits with an error and writes no file when npm-audit-fix sets paths-ignore', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'npm-audit-fix': { 'paths-ignore': ['**/*.md'] } }),
		);

		const result = spawnSync(process.execPath, [scriptPath], { cwd: project, encoding: 'utf-8' });

		expect(result.status).toBe(1);
		expect(result.stderr).toBe(
			`error: ${workflowValuesPath} sets paths-ignore for ${npmAuditFixWorkflowPath}, whose template has no push trigger without paths\n`,
		);
		expect(readdirSync(project, { recursive: true })).toEqual(['.github', workflowValuesPath]);
	});

	it('exits with an error when shared-config-update sets paths-ignore', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'shared-config-update': { 'paths-ignore': ['**/*.md'] } }),
		);

		const result = spawnSync(process.execPath, [scriptPath], { cwd: project, encoding: 'utf-8' });

		expect(result.status).toBe(1);
		expect(result.stderr).toBe(
			`error: ${workflowValuesPath} sets paths-ignore for ${sharedConfigUpdateWorkflowPath}, whose template has no push trigger without paths\n`,
		);
	});

	it('warns and overwrites when an existing caller has paths-ignore values the JSON file lacks', () => {
		const project = createProject();
		writeFileSync(join(project, 'Dockerfile'), 'FROM node\n');
		mkdirSync(join(project, dirname(dockerPublishWorkflowPath)), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'docker-publish': { platforms: 'linux/arm64' } }),
		);
		writeFileSync(
			join(project, dockerPublishWorkflowPath),
			dockerPublishTemplate.replace('      - main\n', '      - main\n    paths-ignore:\n      - "**/*.md"\n'),
		);

		const output = runBootstrap(project);

		expect(output.split('\n').filter((line) => line.startsWith('warning: '))).toEqual([
			`warning: ${dockerPublishWorkflowPath} had paths-ignore values that are not in ${workflowValuesPath}`,
		]);
		expect(readFileSync(join(project, dockerPublishWorkflowPath), 'utf-8')).toBe(
			`${dockerPublishTemplate}      platforms: 'linux/arm64'\n`,
		);
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
