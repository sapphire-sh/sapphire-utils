import { execFileSync, spawnSync } from 'node:child_process';
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = fileURLToPath(new URL('sapphire-bootstrap.js', import.meta.url));
const nodeSharedConfigUpdateWorkflowPath = join('.github', 'workflows', 'node-shared-config-update.yml');
const nodeUtilsUpdateWorkflowPath = join('.github', 'workflows', 'node-utils-update.yml');
const utilsUpdateWorkflowPath = join('.github', 'workflows', 'utils-update.yml');
const dependabotConfigPath = join('.github', 'dependabot.yml');
const nodeAuditFixWorkflowPath = join('.github', 'workflows', 'node-audit-fix.yml');
const dockerPublishWorkflowPath = join('.github', 'workflows', 'docker-publish.yml');
const userscriptPublishWorkflowPath = join('.github', 'workflows', 'userscript-publish.yml');
const nodeVerifyWorkflowPath = join('.github', 'workflows', 'node-verify.yml');
const dependabotReviewRequestWorkflowPath = join('.github', 'workflows', 'dependabot-review-request.yml');
const workflowValuesPath = join('.github', 'sapphire-workflows.json');
const codeOwnersPath = join('.github', 'CODEOWNERS');
const nodeSharedConfigUpdateTemplate = readFileSync(
	fileURLToPath(new URL('../templates/.github/workflows/node-shared-config-update.yml', import.meta.url)),
	'utf-8',
);
const nodeUtilsUpdateTemplate = readFileSync(
	fileURLToPath(new URL('../templates/.github/workflows/node-utils-update.yml', import.meta.url)),
	'utf-8',
);
const dependabotTemplate = readFileSync(
	fileURLToPath(new URL('../templates/.github/dependabot.yml', import.meta.url)),
	'utf-8',
);
const nodeAuditFixTemplate = readFileSync(
	fileURLToPath(new URL('../templates/.github/workflows/node-audit-fix.yml', import.meta.url)),
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
const nodeVerifyTemplate = readFileSync(
	fileURLToPath(new URL('../templates/.github/workflows/node-verify.yml', import.meta.url)),
	'utf-8',
);
const dependabotReviewRequestTemplate = readFileSync(
	fileURLToPath(new URL('../templates/.github/workflows/dependabot-review-request.yml', import.meta.url)),
	'utf-8',
);
const workflowTemplatesDirectory = fileURLToPath(new URL('../templates/.github/workflows', import.meta.url));
const workflowStartupFailureNotifyTemplate = readFileSync(
	join(workflowTemplatesDirectory, 'workflow-startup-failure-notify.yml'),
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
	it('copies the node shared config update workflow when the target does not have one', () => {
		const project = createProject();

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${nodeSharedConfigUpdateWorkflowPath}`);
		expect(readFileSync(join(project, nodeSharedConfigUpdateWorkflowPath), 'utf-8')).toBe(
			nodeSharedConfigUpdateTemplate,
		);
	});

	it('overwrites an existing node shared config update workflow with the template', () => {
		const project = createProject();
		const existing =
			'name: node-shared-config-update\n\njobs:\n  update:\n    with:\n      rebuild_packages: example-package\n';
		mkdirSync(join(project, dirname(nodeSharedConfigUpdateWorkflowPath)), { recursive: true });
		writeFileSync(join(project, nodeSharedConfigUpdateWorkflowPath), existing);

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${nodeSharedConfigUpdateWorkflowPath}`);
		expect(output).not.toContain(`skipped ${nodeSharedConfigUpdateWorkflowPath}`);
		expect(readFileSync(join(project, nodeSharedConfigUpdateWorkflowPath), 'utf-8')).toBe(
			nodeSharedConfigUpdateTemplate,
		);
	});

	it('skips the node shared config update workflow when the target is utils itself', () => {
		const project = createProject();
		writeFileSync(join(project, 'package.json'), JSON.stringify({ name: '@sapphire-sh/utils' }));

		const output = runBootstrap(project);

		expect(output).toContain(`skipped ${nodeSharedConfigUpdateWorkflowPath}`);
		expect(existsSync(join(project, nodeSharedConfigUpdateWorkflowPath))).toBe(false);
	});

	it('copies the daily node utils update workflow with manual dispatch, permissions and token', () => {
		const project = createProject();

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${nodeUtilsUpdateWorkflowPath}`);
		expect(readFileSync(join(project, nodeUtilsUpdateWorkflowPath), 'utf-8')).toBe(
			[
				'name: node-utils-update',
				'',
				'on:',
				'  schedule:',
				"    - cron: '0 0 * * *'",
				'  workflow_dispatch:',
				'',
				'jobs:',
				'  update:',
				'    uses: sapphire-sh/github-actions/.github/workflows/node-utils-update-template.yml@main',
				'    permissions:',
				'      contents: write',
				'      issues: write',
				'      pull-requests: write',
				'    secrets:',
				'      PULL_REQUEST_TOKEN: ${{ secrets.PULL_REQUEST_TOKEN }}',
				'',
			].join('\n'),
		);
	});

	it('overwrites an existing node utils update workflow with the template', () => {
		const project = createProject();
		mkdirSync(join(project, dirname(nodeUtilsUpdateWorkflowPath)), { recursive: true });
		writeFileSync(join(project, nodeUtilsUpdateWorkflowPath), 'name: node-utils-update\n');

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${nodeUtilsUpdateWorkflowPath}`);
		expect(readFileSync(join(project, nodeUtilsUpdateWorkflowPath), 'utf-8')).toBe(nodeUtilsUpdateTemplate);
	});

	it('skips the node utils update workflow when the target is utils itself', () => {
		const project = createProject();
		writeFileSync(join(project, 'package.json'), JSON.stringify({ name: '@sapphire-sh/utils' }));

		const output = runBootstrap(project);

		expect(output).toContain(`skipped ${nodeUtilsUpdateWorkflowPath}`);
		expect(existsSync(join(project, nodeUtilsUpdateWorkflowPath))).toBe(false);
		expect(readFileSync(join(project, nodeAuditFixWorkflowPath), 'utf-8')).toBe(nodeAuditFixTemplate);
	});

	it('appends the node-utils-update with values from the workflow configuration', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'node-utils-update': { with: { run_tests: true, rebuild_packages: 'example-package' } } }),
		);

		runBootstrap(project);

		expect(readFileSync(join(project, nodeUtilsUpdateWorkflowPath), 'utf-8')).toBe(
			`${nodeUtilsUpdateTemplate}    with:\n      run_tests: true\n      rebuild_packages: 'example-package'\n`,
		);
	});

	it('copies the dependabot config when the target does not have one', () => {
		const project = createProject();

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${dependabotConfigPath}`);
		expect(readFileSync(join(project, dependabotConfigPath), 'utf-8')).toBe(dependabotTemplate);
	});

	it('excludes @sapphire-sh/utils from the npm cooldown', () => {
		const project = createProject();

		runBootstrap(project);

		expect(readFileSync(join(project, dependabotConfigPath), 'utf-8')).toBe(
			[
				'version: 2',
				'updates:',
				'  - package-ecosystem: npm',
				'    directory: /',
				'    schedule:',
				'      interval: weekly',
				'    groups:',
				'      dependencies:',
				'        patterns:',
				"          - '*'",
				'        exclude-patterns:',
				"          - '@sapphire-sh/utils'",
				'    cooldown:',
				'      exclude:',
				"        - '@sapphire-sh/utils'",
				'    ignore:',
				"      - dependency-name: '@sapphire-sh/utils'",
				'  - package-ecosystem: github-actions',
				'    directory: /',
				'    schedule:',
				'      interval: weekly',
				'',
			].join('\n'),
		);
	});

	it('writes the dependabot config unchanged when only the root has a package.json', () => {
		const project = createProject();
		writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'example' }));

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${dependabotConfigPath}`);
		expect(readFileSync(join(project, dependabotConfigPath), 'utf-8')).toBe(dependabotTemplate);
	});

	it('lists the root and every subdirectory with a package.json as the npm directories', () => {
		const project = createProject();
		writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'example' }));
		mkdirSync(join(project, 'packages', 'core'), { recursive: true });
		writeFileSync(join(project, 'packages', 'core', 'package.json'), JSON.stringify({ name: 'core' }));
		mkdirSync(join(project, 'apps', 'web'), { recursive: true });
		writeFileSync(join(project, 'apps', 'web', 'package.json'), JSON.stringify({ name: 'web' }));

		runBootstrap(project);

		expect(readFileSync(join(project, dependabotConfigPath), 'utf-8')).toBe(
			dependabotTemplate.replace(
				'  - package-ecosystem: npm\n    directory: /\n',
				"  - package-ecosystem: npm\n    directories:\n      - '/'\n      - '/apps/web'\n      - '/packages/core'\n",
			),
		);
	});

	it('leaves package.json files under node_modules out of the npm directories', () => {
		const project = createProject();
		writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'example' }));
		mkdirSync(join(project, 'node_modules', 'dependency'), { recursive: true });
		writeFileSync(join(project, 'node_modules', 'dependency', 'package.json'), JSON.stringify({ name: 'dependency' }));
		mkdirSync(join(project, 'packages', 'core'), { recursive: true });
		writeFileSync(join(project, 'packages', 'core', 'package.json'), JSON.stringify({ name: 'core' }));

		runBootstrap(project);

		expect(readFileSync(join(project, dependabotConfigPath), 'utf-8')).toBe(
			dependabotTemplate.replace(
				'  - package-ecosystem: npm\n    directory: /\n',
				"  - package-ecosystem: npm\n    directories:\n      - '/'\n      - '/packages/core'\n",
			),
		);
	});

	it('leaves a symlinked directory out of the npm directories', () => {
		const project = createProject();
		writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'example' }));
		mkdirSync(join(project, 'packages', 'core'), { recursive: true });
		writeFileSync(join(project, 'packages', 'core', 'package.json'), JSON.stringify({ name: 'core' }));
		symlinkSync(join(project, 'packages', 'core'), join(project, 'linked'));

		runBootstrap(project);

		expect(readFileSync(join(project, dependabotConfigPath), 'utf-8')).toBe(
			dependabotTemplate.replace(
				'  - package-ecosystem: npm\n    directory: /\n',
				"  - package-ecosystem: npm\n    directories:\n      - '/'\n      - '/packages/core'\n",
			),
		);
	});

	it('lists only the git-tracked package.json directories when the target is a git repository', () => {
		const project = createProject();
		writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'example' }));
		writeFileSync(join(project, '.gitignore'), 'lib/\n');
		mkdirSync(join(project, 'packages', 'core'), { recursive: true });
		writeFileSync(join(project, 'packages', 'core', 'package.json'), JSON.stringify({ name: 'core' }));
		mkdirSync(join(project, 'lib', 'cjs'), { recursive: true });
		writeFileSync(join(project, 'lib', 'cjs', 'package.json'), JSON.stringify({ type: 'commonjs' }));
		execFileSync('git', ['init'], { cwd: project });
		execFileSync('git', ['add', '.'], { cwd: project });

		runBootstrap(project);

		expect(readFileSync(join(project, dependabotConfigPath), 'utf-8')).toBe(
			dependabotTemplate.replace(
				'  - package-ecosystem: npm\n    directory: /\n',
				"  - package-ecosystem: npm\n    directories:\n      - '/'\n      - '/packages/core'\n",
			),
		);
	});

	it('leaves a symlinked directory out of the npm directories when the target is a git repository', () => {
		const project = createProject();
		writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'example' }));
		mkdirSync(join(project, 'packages', 'core'), { recursive: true });
		writeFileSync(join(project, 'packages', 'core', 'package.json'), JSON.stringify({ name: 'core' }));
		symlinkSync(join(project, 'packages', 'core'), join(project, 'linked'));
		execFileSync('git', ['init'], { cwd: project });
		execFileSync('git', ['add', '.'], { cwd: project });

		runBootstrap(project);

		expect(readFileSync(join(project, dependabotConfigPath), 'utf-8')).toBe(
			dependabotTemplate.replace(
				'  - package-ecosystem: npm\n    directory: /\n',
				"  - package-ecosystem: npm\n    directories:\n      - '/'\n      - '/packages/core'\n",
			),
		);
	});

	it('lists a git-tracked package.json directory whose name has non-ASCII characters', () => {
		const project = createProject();
		writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'example' }));
		mkdirSync(join(project, 'packages', '한글'), { recursive: true });
		writeFileSync(join(project, 'packages', '한글', 'package.json'), JSON.stringify({ name: 'korean' }));
		execFileSync('git', ['init'], { cwd: project });
		execFileSync('git', ['add', '.'], { cwd: project });

		runBootstrap(project);

		expect(readFileSync(join(project, dependabotConfigPath), 'utf-8')).toBe(
			dependabotTemplate.replace(
				'  - package-ecosystem: npm\n    directory: /\n',
				"  - package-ecosystem: npm\n    directories:\n      - '/'\n      - '/packages/한글'\n",
			),
		);
	});

	it('assigns the CODEOWNERS default owner to every dependabot update entry', () => {
		const project = createProject();
		const assigneeBlock = "    assignees:\n      - 'example-user'\n";
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(join(project, codeOwnersPath), '* @example-user\n');

		runBootstrap(project);

		expect(readFileSync(join(project, dependabotConfigPath), 'utf-8')).toBe(
			`${dependabotTemplate.replace(
				'  - package-ecosystem: github-actions\n',
				`${assigneeBlock}  - package-ecosystem: github-actions\n`,
			)}${assigneeBlock}`,
		);
	});

	it('writes the CODEOWNERS assignees after the npm cooldown block', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(join(project, codeOwnersPath), '* @example-user\n');

		runBootstrap(project);

		expect(readFileSync(join(project, dependabotConfigPath), 'utf-8')).toBe(
			[
				'version: 2',
				'updates:',
				'  - package-ecosystem: npm',
				'    directory: /',
				'    schedule:',
				'      interval: weekly',
				'    groups:',
				'      dependencies:',
				'        patterns:',
				"          - '*'",
				'        exclude-patterns:',
				"          - '@sapphire-sh/utils'",
				'    cooldown:',
				'      exclude:',
				"        - '@sapphire-sh/utils'",
				'    ignore:',
				"      - dependency-name: '@sapphire-sh/utils'",
				'    assignees:',
				"      - 'example-user'",
				'  - package-ecosystem: github-actions',
				'    directory: /',
				'    schedule:',
				'      interval: weekly',
				'    assignees:',
				"      - 'example-user'",
				'',
			].join('\n'),
		);
	});

	it('writes the npm directories and the CODEOWNERS assignees together', () => {
		const project = createProject();
		const assigneeBlock = "    assignees:\n      - 'example-user'\n";
		writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'example' }));
		mkdirSync(join(project, 'packages', 'core'), { recursive: true });
		writeFileSync(join(project, 'packages', 'core', 'package.json'), JSON.stringify({ name: 'core' }));
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(join(project, codeOwnersPath), '* @example-user\n');

		runBootstrap(project);

		expect(readFileSync(join(project, dependabotConfigPath), 'utf-8')).toBe(
			`${dependabotTemplate
				.replace(
					'  - package-ecosystem: npm\n    directory: /\n',
					"  - package-ecosystem: npm\n    directories:\n      - '/'\n      - '/packages/core'\n",
				)
				.replace(
					'  - package-ecosystem: github-actions\n',
					`${assigneeBlock}  - package-ecosystem: github-actions\n`,
				)}${assigneeBlock}`,
		);
	});

	it('takes only the user owners on the last * line of CODEOWNERS as assignees', () => {
		const project = createProject();
		const assigneeBlock = "    assignees:\n      - 'example-user'\n      - 'second-user'\n";
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, codeOwnersPath),
			[
				'# Default owners',
				'* @first-user',
				'',
				'/docs/ @docs-user',
				'* @example-user @example-org/example-team owner@example.com @second-user # @commented-user',
				'',
			].join('\n'),
		);

		runBootstrap(project);

		expect(readFileSync(join(project, dependabotConfigPath), 'utf-8')).toBe(
			`${dependabotTemplate.replace(
				'  - package-ecosystem: github-actions\n',
				`${assigneeBlock}  - package-ecosystem: github-actions\n`,
			)}${assigneeBlock}`,
		);
	});

	it('writes the dependabot config unchanged when the CODEOWNERS * line has only team and email owners', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(join(project, codeOwnersPath), '* @example-org/example-team owner@example.com\n');

		runBootstrap(project);

		expect(readFileSync(join(project, dependabotConfigPath), 'utf-8')).toBe(dependabotTemplate);
	});

	it('writes the dependabot review request workflow unchanged when the target has no CODEOWNERS', () => {
		const project = createProject();

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${dependabotReviewRequestWorkflowPath}`);
		expect(readFileSync(join(project, dependabotReviewRequestWorkflowPath), 'utf-8')).toBe(
			dependabotReviewRequestTemplate,
		);
	});

	it('passes the CODEOWNERS default owner as the dependabot review request reviewers', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(join(project, codeOwnersPath), '* @example-user\n');

		runBootstrap(project);

		expect(readFileSync(join(project, dependabotReviewRequestWorkflowPath), 'utf-8')).toBe(
			`${dependabotReviewRequestTemplate}    with:\n      reviewers: 'example-user'\n`,
		);
	});

	it('joins the users on the last CODEOWNERS * line with a space as the reviewers value', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(join(project, codeOwnersPath), '* @first-user @second-user\n');

		runBootstrap(project);

		expect(readFileSync(join(project, dependabotReviewRequestWorkflowPath), 'utf-8')).toBe(
			`${dependabotReviewRequestTemplate}    with:\n      reviewers: 'first-user second-user'\n`,
		);
	});

	it('writes the reviewers line after the dependabot-review-request values from .github/sapphire-workflows.json', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(join(project, codeOwnersPath), '* @example-user\n');
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'dependabot-review-request': { with: { runner: 'self-hosted' } } }),
		);

		runBootstrap(project);

		expect(readFileSync(join(project, dependabotReviewRequestWorkflowPath), 'utf-8')).toBe(
			`${dependabotReviewRequestTemplate}    with:\n      runner: 'self-hosted'\n      reviewers: 'example-user'\n`,
		);
	});

	it('prints no warning on a second run when the dependabot review request caller has only the reviewers line', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(join(project, codeOwnersPath), '* @example-user\n');
		runBootstrap(project);

		const output = runBootstrap(project);

		expect(output.split('\n').filter((line) => line.startsWith('warning: '))).toEqual([]);
		expect(readFileSync(join(project, dependabotReviewRequestWorkflowPath), 'utf-8')).toBe(
			`${dependabotReviewRequestTemplate}    with:\n      reviewers: 'example-user'\n`,
		);
	});

	it('warns when the dependabot review request caller has a with: value besides the reviewers line', () => {
		const project = createProject();
		mkdirSync(join(project, dirname(dependabotReviewRequestWorkflowPath)), { recursive: true });
		writeFileSync(join(project, codeOwnersPath), '* @example-user\n');
		writeFileSync(
			join(project, dependabotReviewRequestWorkflowPath),
			`${dependabotReviewRequestTemplate}    with:\n      runner: 'self-hosted'\n      reviewers: 'example-user'\n`,
		);

		const output = runBootstrap(project);

		expect(output.split('\n').filter((line) => line.startsWith('warning: '))).toEqual([
			`warning: ${dependabotReviewRequestWorkflowPath} had with: values that are not in ${workflowValuesPath}`,
		]);
	});

	it('copies the node audit fix workflow when the target does not have one', () => {
		const project = createProject();

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${nodeAuditFixWorkflowPath}`);
		expect(readFileSync(join(project, nodeAuditFixWorkflowPath), 'utf-8')).toContain('node-audit-fix-template.yml');
	});

	it('passes PULL_REQUEST_TOKEN from the callers that open pull requests', () => {
		const project = createProject();
		const secretsBlock = '    secrets:\n      PULL_REQUEST_TOKEN: ${{ secrets.PULL_REQUEST_TOKEN }}\n';

		runBootstrap(project);

		for (const workflowPath of [
			nodeSharedConfigUpdateWorkflowPath,
			nodeUtilsUpdateWorkflowPath,
			nodeAuditFixWorkflowPath,
		]) {
			const content = readFileSync(join(project, workflowPath), 'utf-8');
			expect(content.slice(-secretsBlock.length)).toBe(secretsBlock);
		}
	});

	it('overwrites an existing node audit fix workflow with the template', () => {
		const project = createProject();
		const existing = 'name: node-audit-fix\n\njobs:\n  fix:\n    with:\n      rebuild_packages: example-package\n';
		mkdirSync(join(project, dirname(nodeAuditFixWorkflowPath)), { recursive: true });
		writeFileSync(join(project, nodeAuditFixWorkflowPath), existing);

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${nodeAuditFixWorkflowPath}`);
		expect(output).not.toContain(`skipped ${nodeAuditFixWorkflowPath}`);
		expect(readFileSync(join(project, nodeAuditFixWorkflowPath), 'utf-8')).toBe(nodeAuditFixTemplate);
	});

	it('appends the values from .github/sapphire-workflows.json as a with: block', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({
				'node-shared-config-update': { with: { run_tests: true, rebuild_packages: 'example-package' } },
			}),
		);

		runBootstrap(project);

		expect(readFileSync(join(project, nodeSharedConfigUpdateWorkflowPath), 'utf-8')).toBe(
			`${nodeSharedConfigUpdateTemplate}    with:\n      run_tests: true\n      rebuild_packages: 'example-package'\n`,
		);
		expect(readFileSync(join(project, nodeAuditFixWorkflowPath), 'utf-8')).toBe(nodeAuditFixTemplate);
	});

	it('writes a with: value containing a single quote in JSON notation', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'node-shared-config-update': { with: { key: "it's" } } }),
		);

		runBootstrap(project);

		expect(readFileSync(join(project, nodeSharedConfigUpdateWorkflowPath), 'utf-8')).toBe(
			`${nodeSharedConfigUpdateTemplate}    with:\n      key: "it's"\n`,
		);
	});

	it('warns and overwrites when an existing caller has with: values the JSON file lacks', () => {
		const project = createProject();
		mkdirSync(join(project, dirname(nodeSharedConfigUpdateWorkflowPath)), { recursive: true });
		writeFileSync(
			join(project, nodeSharedConfigUpdateWorkflowPath),
			'name: node-shared-config-update\n\njobs:\n  update:\n    with:\n      rebuild_packages: example-package\n',
		);
		writeFileSync(join(project, nodeAuditFixWorkflowPath), 'name: node-audit-fix\n\njobs:\n  fix:\n');

		const output = runBootstrap(project);

		expect(output.split('\n').filter((line) => line.startsWith('warning: '))).toEqual([
			`warning: ${nodeSharedConfigUpdateWorkflowPath} had with: values that are not in ${workflowValuesPath}`,
		]);
		expect(readFileSync(join(project, nodeSharedConfigUpdateWorkflowPath), 'utf-8')).toBe(
			nodeSharedConfigUpdateTemplate,
		);
		expect(readFileSync(join(project, nodeAuditFixWorkflowPath), 'utf-8')).toBe(nodeAuditFixTemplate);
	});

	it('prints no warning on a second run when every caller has only the with: lines of its template', () => {
		const project = createProject();
		writeFileSync(join(project, 'Dockerfile'), 'FROM node\n');
		runBootstrap(project);

		const output = runBootstrap(project);

		expect(output.split('\n').filter((line) => line.startsWith('warning: '))).toEqual([]);
	});

	it('warns when an existing caller has a with: line besides the lines of its template', () => {
		const project = createProject();
		writeFileSync(join(project, 'Dockerfile'), 'FROM node\n');
		mkdirSync(join(project, dirname(dockerPublishWorkflowPath)), { recursive: true });
		writeFileSync(join(project, dockerPublishWorkflowPath), `${dockerPublishTemplate}      platforms: 'linux/arm64'\n`);

		const output = runBootstrap(project);

		expect(output.split('\n').filter((line) => line.startsWith('warning: '))).toEqual([
			`warning: ${dockerPublishWorkflowPath} had with: values that are not in ${workflowValuesPath}`,
		]);
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
		expect(readFileSync(join(project, nodeSharedConfigUpdateWorkflowPath), 'utf-8')).toBe(
			nodeSharedConfigUpdateTemplate,
		);
	});

	it('removes the npm-audit-fix and shared-config-update callers renamed to node-audit-fix and node-shared-config-update', () => {
		const project = createProject();
		const npmAuditFixWorkflowPath = join('.github', 'workflows', 'npm-audit-fix.yml');
		const sharedConfigUpdateWorkflowPath = join('.github', 'workflows', 'shared-config-update.yml');
		mkdirSync(join(project, dirname(npmAuditFixWorkflowPath)), { recursive: true });
		writeFileSync(join(project, npmAuditFixWorkflowPath), 'name: npm-audit-fix\n');
		writeFileSync(join(project, sharedConfigUpdateWorkflowPath), 'name: shared-config-update\n');

		const output = runBootstrap(project);

		expect(output.split('\n').filter((line) => line.startsWith('removed '))).toEqual([
			`removed ${npmAuditFixWorkflowPath}`,
			`removed ${sharedConfigUpdateWorkflowPath}`,
		]);
		expect(existsSync(join(project, npmAuditFixWorkflowPath))).toBe(false);
		expect(existsSync(join(project, sharedConfigUpdateWorkflowPath))).toBe(false);
		expect(readFileSync(join(project, nodeAuditFixWorkflowPath), 'utf-8')).toBe(nodeAuditFixTemplate);
		expect(readFileSync(join(project, nodeSharedConfigUpdateWorkflowPath), 'utf-8')).toBe(
			nodeSharedConfigUpdateTemplate,
		);
	});

	it('prints no removed line when the target has no obsolete workflow', () => {
		const project = createProject();

		const output = runBootstrap(project);

		expect(output.split('\n').filter((line) => line.startsWith('removed '))).toEqual([]);
		expect(output).toContain(`wrote ${nodeSharedConfigUpdateWorkflowPath}`);
	});

	it('copies the node audit fix workflow when the target is utils itself', () => {
		const project = createProject();
		writeFileSync(join(project, 'package.json'), JSON.stringify({ name: '@sapphire-sh/utils' }));

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${nodeAuditFixWorkflowPath}`);
		expect(readFileSync(join(project, nodeAuditFixWorkflowPath), 'utf-8')).toContain('node-audit-fix-template.yml');
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
			"name: Build and Push Docker Image\n\non:\n  push:\n    branches:\n      - main\n    paths-ignore:\n      - '.github/**'\n      - '**/*.md'\n      - '.vscode/**'\n  pull_request:\n",
		);
	});

	it('passes actions: read and contents: read from the docker publish caller job', () => {
		const project = createProject();
		writeFileSync(join(project, 'Dockerfile'), 'FROM node\n');

		runBootstrap(project);

		const content = readFileSync(join(project, dockerPublishWorkflowPath), 'utf-8');
		expect(content.slice(content.indexOf('jobs:\n'))).toBe(
			[
				'jobs:',
				'  call-shared-ci:',
				'    uses: sapphire-sh/github-actions/.github/workflows/docker-publish-template.yml@main',
				'    permissions:',
				'      actions: read',
				'      contents: read',
				'    secrets: inherit',
				'    with:',
				'      image_name: ${{ github.event.repository.name }}',
				'',
			].join('\n'),
		);
	});

	it('skips the docker publish workflow when the target has no Dockerfile', () => {
		const project = createProject();

		const output = runBootstrap(project);

		expect(output).toContain(`skipped ${dockerPublishWorkflowPath}`);
		expect(existsSync(join(project, dockerPublishWorkflowPath))).toBe(false);
		expect(output).toContain(`wrote ${nodeSharedConfigUpdateWorkflowPath}`);
		expect(readFileSync(join(project, nodeSharedConfigUpdateWorkflowPath), 'utf-8')).toBe(
			nodeSharedConfigUpdateTemplate,
		);
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
				"    paths-ignore:\n      - '.github/**'\n      - '**/*.md'\n      - '.vscode/**'\n",
				"    paths-ignore:\n      - '**/*.md'\n      - 'example/**'\n",
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
				"    paths-ignore:\n      - '.github/**'\n      - '**/*.md'\n      - '.vscode/**'\n",
				"    paths:\n      - 'src/**'\n",
			),
		);
	});

	it('writes the default paths-ignore list after the branches list when the target has only a Dockerfile', () => {
		const project = createProject();
		writeFileSync(join(project, 'Dockerfile'), 'FROM node\n');

		runBootstrap(project);

		expect(readFileSync(join(project, dockerPublishWorkflowPath), 'utf-8')).toBe(
			[
				'name: Build and Push Docker Image',
				'',
				'on:',
				'  push:',
				'    branches:',
				'      - main',
				'    paths-ignore:',
				"      - '.github/**'",
				"      - '**/*.md'",
				"      - '.vscode/**'",
				'  pull_request:',
				'',
				'concurrency:',
				'  group: ${{ github.workflow }}-${{ github.ref }}',
				'  cancel-in-progress: true',
				'',
				'jobs:',
				'  call-shared-ci:',
				'    uses: sapphire-sh/github-actions/.github/workflows/docker-publish-template.yml@main',
				'    permissions:',
				'      actions: read',
				'      contents: read',
				'    secrets: inherit',
				'    with:',
				'      image_name: ${{ github.event.repository.name }}',
				'',
			].join('\n'),
		);
	});

	it('replaces the default paths-ignore list with the docker-publish push.paths-ignore values', () => {
		const project = createProject();
		writeFileSync(join(project, 'Dockerfile'), 'FROM node\n');
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'docker-publish': { push: { 'paths-ignore': ['example/**'] } } }),
		);

		runBootstrap(project);

		expect(readFileSync(join(project, dockerPublishWorkflowPath), 'utf-8')).toBe(
			dockerPublishTemplate.replace(
				"    paths-ignore:\n      - '.github/**'\n      - '**/*.md'\n      - '.vscode/**'\n",
				"    paths-ignore:\n      - 'example/**'\n",
			),
		);
	});

	it('replaces the default paths-ignore list with the docker-publish push.paths values', () => {
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
				"    paths-ignore:\n      - '.github/**'\n      - '**/*.md'\n      - '.vscode/**'\n",
				"    paths:\n      - 'src/**'\n",
			),
		);
	});

	it('prints no warning on a second run when the docker publish caller has the default paths-ignore list', () => {
		const project = createProject();
		writeFileSync(join(project, 'Dockerfile'), 'FROM node\n');
		runBootstrap(project);

		const output = runBootstrap(project);

		expect(output.split('\n').filter((line) => line.startsWith('warning: '))).toEqual([]);
	});

	it('warns when an existing docker publish caller has a paths-ignore list other than the default', () => {
		const project = createProject();
		writeFileSync(join(project, 'Dockerfile'), 'FROM node\n');
		mkdirSync(join(project, dirname(dockerPublishWorkflowPath)), { recursive: true });
		writeFileSync(
			join(project, dockerPublishWorkflowPath),
			dockerPublishTemplate.replace(
				"    paths-ignore:\n      - '.github/**'\n      - '**/*.md'\n      - '.vscode/**'\n",
				"    paths-ignore:\n      - 'src/**'\n",
			),
		);

		const output = runBootstrap(project);

		expect(output.split('\n').filter((line) => line.startsWith('warning: '))).toEqual([
			`warning: ${dockerPublishWorkflowPath} had paths-ignore values that are not in ${workflowValuesPath}`,
		]);
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

	it('exits with an error and writes no file when node-audit-fix sets paths-ignore', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'node-audit-fix': { push: { 'paths-ignore': ['**/*.md'] } } }),
		);

		const result = spawnSync(process.execPath, [scriptPath], { cwd: project, encoding: 'utf-8' });

		expect(result.status).toBe(1);
		expect(result.stderr).toBe(
			`error: ${workflowValuesPath} sets push.paths-ignore for ${nodeAuditFixWorkflowPath}, whose template has no push trigger without paths\n`,
		);
		expect(readdirSync(project, { recursive: true })).toEqual(['.github', workflowValuesPath]);
	});

	it('exits with an error when node-audit-fix sets push.paths', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'node-audit-fix': { push: { paths: ['src/**'] } } }),
		);

		const result = spawnSync(process.execPath, [scriptPath], { cwd: project, encoding: 'utf-8' });

		expect(result.status).toBe(1);
		expect(result.stderr).toBe(
			`error: ${workflowValuesPath} sets push.paths for ${nodeAuditFixWorkflowPath}, whose template has no push trigger without paths\n`,
		);
	});

	it('exits with an error when node-shared-config-update sets paths-ignore', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'node-shared-config-update': { push: { 'paths-ignore': ['**/*.md'] } } }),
		);

		const result = spawnSync(process.execPath, [scriptPath], { cwd: project, encoding: 'utf-8' });

		expect(result.status).toBe(1);
		expect(result.stderr).toBe(
			`error: ${workflowValuesPath} sets push.paths-ignore for ${nodeSharedConfigUpdateWorkflowPath}, whose template has no push trigger without paths\n`,
		);
	});

	it('exits with an error when an entry names no workflow template', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'shared-config-update': { with: { run_tests: true } } }),
		);

		const result = spawnSync(process.execPath, [scriptPath], { cwd: project, encoding: 'utf-8' });

		expect(result.status).toBe(1);
		expect(result.stderr).toBe(`error: ${workflowValuesPath} shared-config-update names no workflow template\n`);
		expect(readdirSync(project, { recursive: true })).toEqual(['.github', workflowValuesPath]);
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

	it('passes actions: read and contents: write from the userscript publish caller job', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'userscript-publish': { with: { assets: 'dist/*.user.js' } } }),
		);

		runBootstrap(project);

		const content = readFileSync(join(project, userscriptPublishWorkflowPath), 'utf-8');
		expect(content.slice(content.indexOf('jobs:\n'))).toBe(
			[
				'jobs:',
				'  call-shared-publish:',
				'    uses: sapphire-sh/github-actions/.github/workflows/userscript-publish-template.yml@main',
				'    permissions:',
				'      actions: read',
				'      contents: write',
				'    secrets: inherit',
				'    with:',
				"      assets: 'dist/*.user.js'",
				'',
			].join('\n'),
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

	it('writes the node verify workflow when the JSON file has no userscript-publish entry', () => {
		const project = createProject();

		const output = runBootstrap(project);

		expect(output).toContain(`wrote ${nodeVerifyWorkflowPath}`);
		expect(readFileSync(join(project, nodeVerifyWorkflowPath), 'utf-8')).toBe(nodeVerifyTemplate);
	});

	it('skips the node verify workflow when the JSON file has a userscript-publish entry', () => {
		const project = createProject();
		mkdirSync(join(project, '.github'), { recursive: true });
		writeFileSync(
			join(project, workflowValuesPath),
			JSON.stringify({ 'userscript-publish': { with: { assets: 'dist/*.user.js' } } }),
		);

		const output = runBootstrap(project);

		expect(output).toContain(`skipped ${nodeVerifyWorkflowPath}`);
		expect(existsSync(join(project, nodeVerifyWorkflowPath))).toBe(false);
		expect(output).toContain(`wrote ${userscriptPublishWorkflowPath}`);
	});

	it('skips the node verify workflow when the target is utils itself', () => {
		const project = createProject();
		writeFileSync(join(project, 'package.json'), JSON.stringify({ name: '@sapphire-sh/utils' }));

		const output = runBootstrap(project);

		expect(output).toContain(`skipped ${nodeVerifyWorkflowPath}`);
		expect(existsSync(join(project, nodeVerifyWorkflowPath))).toBe(false);
		expect(output).toContain(`wrote ${nodeAuditFixWorkflowPath}`);
	});

	it('watches the name: of every other workflow template from the startup failure notify workflow', () => {
		const otherNames = readdirSync(workflowTemplatesDirectory)
			.filter((name) => name !== 'workflow-startup-failure-notify.yml')
			.map((name) => /^name: (.*)$/m.exec(readFileSync(join(workflowTemplatesDirectory, name), 'utf-8'))?.[1]);
		const [, watchedBlock] = /^ {4}workflows:\n((?: {6}- .*\n)*)/m.exec(workflowStartupFailureNotifyTemplate) ?? [];
		const watchedNames = watchedBlock
			.split('\n')
			.filter((line) => line !== '')
			.map((line) => line.slice('      - '.length));

		expect(watchedNames.toSorted()).toEqual(otherNames.toSorted());
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
