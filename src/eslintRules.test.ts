import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
import { sapphirePlugin } from './eslintRules';

const linter = new Linter();

const lint = (code: string) =>
	linter.verify(code, {
		plugins: { sapphire: sapphirePlugin },
		rules: { 'sapphire/no-control-characters': 'error' },
	});

// Build strings containing raw control characters at runtime so this source file
// itself stays free of the very characters the rule is meant to catch.
const NUL = String.fromCharCode(0x00);
const BELL = String.fromCharCode(0x07);
const DEL = String.fromCharCode(0x7f);

describe('no-control-characters', () => {
	it('reports a NUL inside a string literal', () => {
		const messages = lint(`const value = "${NUL}";`);
		expect(messages).toHaveLength(1);
		expect(messages[0].messageId).toBe('controlCharacter');
	});

	it('reports a control character inside a comment', () => {
		const messages = lint(`// bell ${BELL} here`);
		expect(messages).toHaveLength(1);
		expect(messages[0].messageId).toBe('controlCharacter');
	});

	it('reports the offending code point', () => {
		const messages = lint(`const value = "${NUL}";`);
		expect(messages[0].message).toContain('U+0000');
	});

	it('reports DEL (U+007F)', () => {
		const messages = lint(`const value = "${DEL}";`);
		expect(messages).toHaveLength(1);
		expect(messages[0].message).toContain('U+007F');
	});

	it('reports every occurrence', () => {
		const messages = lint(`const a = "${NUL}";\nconst b = "${BELL}";`);
		expect(messages).toHaveLength(2);
	});

	it('allows tab, newline, and carriage return', () => {
		// Tab lives inside a string literal; newline and CR separate statements.
		const messages = lint('const a = "x\ty";\nconst b = 1;\r\n');
		expect(messages).toHaveLength(0);
	});

	it('allows ordinary source', () => {
		const messages = lint('const value = 1;\n');
		expect(messages).toHaveLength(0);
	});
});
