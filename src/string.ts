const escapeMap: Record<string, string> = {
	'"': '&quot;',
	"'": '&apos;',
	'<': '&lt;',
	'>': '&gt;',
	'&': '&amp;',
};

export const escapeHtml = (value: string): string => value.replaceAll(/["'<>&]/g, (match) => escapeMap[match] ?? match);
