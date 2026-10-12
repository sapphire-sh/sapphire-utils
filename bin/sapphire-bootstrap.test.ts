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
const userscriptPublishWorkflowPath = join('.github', 'workflows', 'userscript-publish.yml');
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
const userscriptPublishTemplate = readFileSync(
	fileURLToPath(new URL('../templates/.github/workflows/userscript-publish.yml', import.meta.url)),
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

	it('passes PULL_REQUEST_TOKEN from the callers that open pull requests', () => {
		const project = createProject();
		const secretsBlock = '    secrets:\n      PULL_REQUEST_TOKEN: ${{ secrets.PULL_REQUEST_TOKEN }}\n';

		runBootstrap(project);

		for (const workflowPath of [sharedConfigUpdateWorkflowPath, npmAuditFixWorkflowPath]) {
			const content = readFileSync(join(project, workflowPath), 'utf-8');
			expect(content.slice(-secretsBlock.length)).toBe(secretsBlock);
		}
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
			JSON.stringify({ 'shared-config-update': { with: { run_tests: true, rebuild_packages: 'example-package' } } }),
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
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'shared-config-update': { with: { key: "it's" } } }),
		);

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

	it('triggers the docker publish workflow on pull requests without a branch filter', () => {
		const project = createProject();
		writeFileSync(join(project, 'Dockerfile'), 'FROM node\n');

		runBootstrap(project);

		const content = readFileSync(join(project, dockerPublishWorkflowPath), 'utf-8');
		expect(content.slice(0, content.indexOf('\nconcurrency:'))).toBe(
			'name: Build and Push Docker Image\n\non:\n  push:\n    branches:\n      - main\n  pull_request:\n',
		);
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
			JSON.stringify({ 'docker-publish': { with: { platforms: 'linux/arm64', run_tests: true } } }),
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
				'docker-publish': {
					push: { 'paths-ignore': ['**/*.md', 'example/**'] },
					with: { platforms: 'linux/arm64' },
				},
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

	it('puts the docker-publish paths values after the branches list', () => {
		const project = createProject();
		writeFileSync(join(project, 'Dockerfile'), 'FROM node\n');
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'docker-publish': { push: { paths: ['src/**'] } } }),
		);

		runBootstrap(project);

		expect(readFileSync(join(project, dockerPublishWorkflowPath), 'utf-8')).toBe(
			dockerPublishTemplate.replace(
				'    branches:\n      - main\n',
				"    branches:\n      - main\n    paths:\n      - 'src/**'\n",
			),
		);
	});

	it('exits with an error when an entry has a key other than push and with', () => {
		const project = createProject();
		writeFileSync(join(project, 'Dockerfile'), 'FROM node\n');
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(join(project, workflowValuesPath), JSON.stringify({ 'docker-publish': { run_tests: true } }));

		const result = spawnSync(process.execPath, [scriptPath], { cwd: project, encoding: 'utf-8' });

		expect(result.status).toBe(1);
		expect(result.stderr).toBe(`error: ${workflowValuesPath} docker-publish has unknown key run_tests\n`);
		expect(readdirSync(project, { recursive: true }).toSorted()).toEqual(
			['.github', workflowValuesPath, 'Dockerfile'].toSorted(),
		);
	});

	it('exits with an error when push has a key other than paths and paths-ignore', () => {
		const project = createProject();
		writeFileSync(join(project, 'Dockerfile'), 'FROM node\n');
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'docker-publish': { push: { branches: ['main'] } } }),
		);

		const result = spawnSync(process.execPath, [scriptPath], { cwd: project, encoding: 'utf-8' });

		expect(result.status).toBe(1);
		expect(result.stderr).toBe(`error: ${workflowValuesPath} docker-publish.push has unknown key branches\n`);
	});

	it('exits with an error when push sets both paths and paths-ignore', () => {
		const project = createProject();
		writeFileSync(join(project, 'Dockerfile'), 'FROM node\n');
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'docker-publish': { push: { paths: ['src/**'], 'paths-ignore': ['**/*.md'] } } }),
		);

		const result = spawnSync(process.execPath, [scriptPath], { cwd: project, encoding: 'utf-8' });

		expect(result.status).toBe(1);
		expect(result.stderr).toBe(`error: ${workflowValuesPath} docker-publish.push sets both paths and paths-ignore\n`);
	});

	it('exits with an error and writes no file when npm-audit-fix sets paths-ignore', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'npm-audit-fix': { push: { 'paths-ignore': ['**/*.md'] } } }),
		);

		const result = spawnSync(process.execPath, [scriptPath], { cwd: project, encoding: 'utf-8' });

		expect(result.status).toBe(1);
		expect(result.stderr).toBe(
			`error: ${workflowValuesPath} sets push.paths-ignore for ${npmAuditFixWorkflowPath}, whose template has no push trigger without paths\n`,
		);
		expect(readdirSync(project, { recursive: true })).toEqual(['.github', workflowValuesPath]);
	});

	it('exits with an error when npm-audit-fix sets push.paths', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'npm-audit-fix': { push: { paths: ['src/**'] } } }),
		);

		const result = spawnSync(process.execPath, [scriptPath], { cwd: project, encoding: 'utf-8' });

		expect(result.status).toBe(1);
		expect(result.stderr).toBe(
			`error: ${workflowValuesPath} sets push.paths for ${npmAuditFixWorkflowPath}, whose template has no push trigger without paths\n`,
		);
	});

	it('exits with an error when shared-config-update sets paths-ignore', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'shared-config-update': { push: { 'paths-ignore': ['**/*.md'] } } }),
		);

		const result = spawnSync(process.execPath, [scriptPath], { cwd: project, encoding: 'utf-8' });

		expect(result.status).toBe(1);
		expect(result.stderr).toBe(
			`error: ${workflowValuesPath} sets push.paths-ignore for ${sharedConfigUpdateWorkflowPath}, whose template has no push trigger without paths\n`,
		);
	});

	it('warns and overwrites when an existing caller has paths-ignore values the JSON file lacks', () => {
		const project = createProject();
		writeFileSync(join(project, 'Dockerfile'), 'FROM node\n');
		mkdirSync(join(project, dirname(dockerPublishWorkflowPath)), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'docker-publish': { with: { platforms: 'linux/arm64' } } }),
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

	it('writes the userscript publish workflow with the with.assets value when the JSON file has its entry', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'userscript-publish': { with: { assets: 'dist/*.user.js' } } }),
		);

		runBootstrap(project);

		expect(readFileSync(join(project, userscriptPublishWorkflowPath), 'utf-8')).toBe(
			`${userscriptPublishTemplate}    with:\n      assets: 'dist/*.user.js'\n`,
		);
	});

	it('skips the userscript publish workflow when the JSON file has no userscript-publish entry', () => {
		const project = createProject();

		const output = runBootstrap(project);

		expect(output).toContain(`skipped ${userscriptPublishWorkflowPath}`);
		expect(existsSync(join(project, userscriptPublishWorkflowPath))).toBe(false);
	});

	it('exits with an error when the userscript-publish entry has no with.assets', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(join(project, workflowValuesPath), JSON.stringify({ 'userscript-publish': {} }));

		const result = spawnSync(process.execPath, [scriptPath], { cwd: project, encoding: 'utf-8' });

		expect(result.status).toBe(1);
		expect(result.stderr).toBe(`error: ${workflowValuesPath} userscript-publish has no with.assets\n`);
		expect(readdirSync(project, { recursive: true })).toEqual(['.github', workflowValuesPath]);
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
