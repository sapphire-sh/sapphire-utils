export async function sendSlackMessage(url: string, text: string): Promise<void> {
	const resp = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ text }),
	});
	if (!resp.ok) {
		throw new Error(`Slack webhook failed: HTTP ${resp.status}`);
	}
}
