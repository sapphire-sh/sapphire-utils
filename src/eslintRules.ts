import type { ESLint, Rule } from 'eslint';
import type { Node } from 'estree';

// C0 control characters and DEL, excluding tab (U+0009), LF (U+000A), and CR (U+000D).
// Matching control characters is the whole point of this rule, so no-control-regex is expected here.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTER_PATTERN = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]', 'g');

export const noControlCharacters: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow NUL and other control characters anywhere in source text',
		},
		schema: [],
		messages: {
			controlCharacter: 'Unexpected control character U+{{code}} in source.',
		},
	},
	create(context) {
		const { sourceCode } = context;
		return {
			Program(node) {
				const text = sourceCode.getText();
				for (const match of text.matchAll(CONTROL_CHARACTER_PATTERN)) {
					const { index } = match;
					const code = match[0].charCodeAt(0).toString(16).padStart(4, '0').toUpperCase();
					context.report({
						node,
						loc: {
							start: sourceCode.getLocFromIndex(index),
							end: sourceCode.getLocFromIndex(index + 1),
						},
						messageId: 'controlCharacter',
						data: { code },
					});
				}
			},
		};
	},
};

const isProcessEnv = (node: Node): boolean =>
	node.type === 'MemberExpression' &&
	!node.computed &&
	node.object.type === 'Identifier' &&
	node.object.name === 'process' &&
	node.property.type === 'Identifier' &&
	node.property.name === 'env';

export const preferReadEnv: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow fallback operators on process.env values, which keep an empty string as a value',
		},
		schema: [],
		messages: {
			preferReadEnv:
				'Use readEnv() from @sapphire-sh/utils instead of a fallback operator on process.env, which does not treat an empty string as unset.',
		},
	},
	create(context) {
		return {
			LogicalExpression(node) {
				if (node.operator !== '??' && node.operator !== '||') {
					return;
				}
				if (node.left.type !== 'MemberExpression' || !isProcessEnv(node.left.object)) {
					return;
				}
				context.report({ node, messageId: 'preferReadEnv' });
			},
		};
	},
};

export const sapphirePlugin: ESLint.Plugin = {
	rules: {
		'no-control-characters': noControlCharacters,
		'prefer-read-env': preferReadEnv,
	},
};
