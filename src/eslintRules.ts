import type { ESLint, Rule } from 'eslint';

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

export const sapphirePlugin: ESLint.Plugin = {
	rules: {
		'no-control-characters': noControlCharacters,
	},
};
