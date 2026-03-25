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

export async function notifyMattermost(baseUrl: string, token: string, channelId: string, message: string): Promise<void> {
	const resp = await fetch(`${baseUrl}/api/v4/posts`, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ channel_id: channelId, message }),
	});
	if (!resp.ok) {
		throw new Error(`Mattermost post failed: HTTP ${resp.status}`);
	}
}
