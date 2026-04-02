import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import promise from 'eslint-plugin-promise';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	prettier,
	promise.configs['flat/recommended'],
	{
		rules: {
			// General
			'arrow-body-style': ['error', 'as-needed'],
			curly: 'error',
			eqeqeq: ['error', 'always'],
			'func-style': ['error', 'expression'],
			'no-console': 'off',
			'sort-imports': ['error', { ignoreDeclarationSort: true }],
			'no-constant-condition': ['error', { checkLoops: false }],
			'no-else-return': 'error',
			'no-negated-condition': 'error',
			'no-nested-ternary': 'error',
			'no-param-reassign': 'error',
			'no-restricted-globals': [
				'error',
				{ name: 'parseInt', message: 'Use Number.parseInt instead.' },
				{ name: 'parseFloat', message: 'Use Number.parseFloat instead.' },
				{ name: 'isNaN', message: 'Use Number.isNaN instead.' },
				{ name: 'isFinite', message: 'Use Number.isFinite instead.' },
			],
			'no-restricted-imports': [
				'error',
				{ name: 'assert', message: 'Use `node:assert` instead.' },
				{ name: 'buffer', message: 'Use `node:buffer` instead.' },
				{ name: 'child_process', message: 'Use `node:child_process` instead.' },
				{ name: 'cluster', message: 'Use `node:cluster` instead.' },
				{ name: 'crypto', message: 'Use `node:crypto` instead.' },
				{ name: 'dgram', message: 'Use `node:dgram` instead.' },
				{ name: 'dns', message: 'Use `node:dns` instead.' },
				{ name: 'events', message: 'Use `node:events` instead.' },
				{ name: 'fs', message: 'Use `node:fs` instead.' },
				{ name: 'fs/promises', message: 'Use `node:fs/promises` instead.' },
				{ name: 'http', message: 'Use `node:http` instead.' },
				{ name: 'http2', message: 'Use `node:http2` instead.' },
				{ name: 'https', message: 'Use `node:https` instead.' },
				{ name: 'net', message: 'Use `node:net` instead.' },
				{ name: 'os', message: 'Use `node:os` instead.' },
				{ name: 'path', message: 'Use `node:path` instead.' },
				{ name: 'path/posix', message: 'Use `node:path/posix` instead.' },
				{ name: 'path/win32', message: 'Use `node:path/win32` instead.' },
				{ name: 'perf_hooks', message: 'Use `node:perf_hooks` instead.' },
				{ name: 'process', message: 'Use `node:process` instead.' },
				{ name: 'querystring', message: 'Use `node:querystring` instead.' },
				{ name: 'readline', message: 'Use `node:readline` instead.' },
				{ name: 'stream', message: 'Use `node:stream` instead.' },
				{ name: 'stream/promises', message: 'Use `node:stream/promises` instead.' },
				{ name: 'string_decoder', message: 'Use `node:string_decoder` instead.' },
				{ name: 'timers', message: 'Use `node:timers` instead.' },
				{ name: 'timers/promises', message: 'Use `node:timers/promises` instead.' },
				{ name: 'tls', message: 'Use `node:tls` instead.' },
				{ name: 'url', message: 'Use `node:url` instead.' },
				{ name: 'util', message: 'Use `node:util` instead.' },
				{ name: 'worker_threads', message: 'Use `node:worker_threads` instead.' },
				{ name: 'zlib', message: 'Use `node:zlib` instead.' },
			],
			'no-throw-literal': 'error',
			'no-unneeded-ternary': 'error',
			'no-var': 'error',
			'object-shorthand': 'error',
			'prefer-arrow-callback': 'error',
			'prefer-const': 'error',
			'prefer-destructuring': 'error',
			'prefer-template': 'error',
			yoda: 'error',

			// TypeScript
			'@typescript-eslint/array-type': ['error', { default: 'array' }],
			'@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
			'@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
			'@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'separate-type-imports' }],
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: 'interface',
					format: ['PascalCase'],
					custom: { regex: '^I[A-Z]', match: false },
				},
			],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-namespace': 'off',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'@typescript-eslint/no-shadow': 'off',
			'@typescript-eslint/no-unnecessary-type-assertion': 'error',
			'@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
			'@typescript-eslint/prefer-nullish-coalescing': 'error',
			'@typescript-eslint/prefer-optional-chain': 'error',
		},
	},
	{
		// Type-aware rules (requires parserOptions.project in consumer config)
		rules: {
			'no-restricted-syntax': [
				'error',
				{
					selector: 'CallExpression[callee.property.name="then"]',
					message: 'Use async/await instead of .then()',
				},
				{
					selector: 'CallExpression[callee.property.name="catch"]',
					message: 'Use try/catch with async/await instead of .catch()',
				},
				{
					selector: 'SwitchCase > *.consequent[type!="BlockStatement"]',
					message: 'Switch case bodies must be wrapped in a block statement (braces).',
				},
			],
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-misused-promises': 'error',
			'@typescript-eslint/no-unnecessary-condition': 'error',
			'@typescript-eslint/prefer-readonly': 'error',
			'@typescript-eslint/promise-function-async': 'error',
			'@typescript-eslint/return-await': ['error', 'in-try-catch'],
			'@typescript-eslint/strict-boolean-expressions': 'error',
			'@typescript-eslint/switch-exhaustiveness-check': ['error', { allowDefaultCaseForExhaustiveSwitch: true }],
			'promise/prefer-await-to-callbacks': 'error',
			'promise/prefer-await-to-then': 'error',
		},
		languageOptions: {
			parserOptions: {
				project: true,
			},
		},
	},
	{
		ignores: ['*.config.js', '**/*.json', 'coverage/', 'dist/', 'lib/', 'node_modules/'],
	},
);
