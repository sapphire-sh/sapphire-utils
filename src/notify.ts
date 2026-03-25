export async function notifySlack(url: string, text: string): Promise<void> {
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

export async function notifyMattermost(url: string, text: string): Promise<void> {
	const resp = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ text }),
	});
	if (!resp.ok) {
		throw new Error(`Mattermost webhook failed: HTTP ${resp.status}`);
	}
}
