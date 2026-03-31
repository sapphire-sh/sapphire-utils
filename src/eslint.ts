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
			'no-console': 'off',
			'no-constant-condition': ['error', { checkLoops: false }],
			'no-var': 'error',
			'no-throw-literal': 'error',
			'no-param-reassign': 'error',
			'no-nested-ternary': 'error',
			'no-unneeded-ternary': 'error',
			'prefer-const': 'error',
			'prefer-template': 'error',
			'prefer-destructuring': 'error',
			'prefer-arrow-callback': 'error',
			eqeqeq: ['error', 'always'],
			'object-shorthand': 'error',
			'no-else-return': 'error',
			'arrow-body-style': ['error', 'as-needed'],
			'func-style': ['error', 'expression'],
			yoda: 'error',
			curly: 'error',

			// TypeScript
			'@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: 'interface',
					format: ['PascalCase'],
					custom: { regex: '^I[A-Z]', match: false },
				},
			],
			'@typescript-eslint/no-namespace': 'off',
			'@typescript-eslint/no-shadow': 'off',
			'@typescript-eslint/consistent-type-imports': 'error',
			'@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'@typescript-eslint/no-unnecessary-type-assertion': 'error',
			'@typescript-eslint/array-type': ['error', { default: 'array' }],
			'@typescript-eslint/prefer-nullish-coalescing': 'error',
			'@typescript-eslint/prefer-optional-chain': 'error',
		},
	},
	{
		// Type-aware rules (requires parserOptions.project in consumer config)
		rules: {
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-misused-promises': 'error',
			'@typescript-eslint/promise-function-async': 'error',
			'promise/prefer-await-to-then': 'error',
			'promise/prefer-await-to-callbacks': 'error',
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
			'@typescript-eslint/no-unnecessary-condition': 'error',
			'@typescript-eslint/switch-exhaustiveness-check': 'error',
			'@typescript-eslint/return-await': ['error', 'in-try-catch'],
			'@typescript-eslint/prefer-readonly': 'error',
			'@typescript-eslint/strict-boolean-expressions': 'error',
		},
		languageOptions: {
			parserOptions: {
				project: true,
			},
		},
	},
	{
		ignores: ['**/*.json', 'node_modules/', 'coverage/', 'lib/'],
	},
);
