import { logger } from './logger.js';
import { sleep } from './sleep.js';

const MAX_RETRIES = 2;
const FALLBACK_RETRY_DELAY_MS = 2048;

export const notifySlack = async (url: string, text: string): Promise<void> => {
	logger.debug('[notifySlack] posting to webhook', { textLength: text.length });
	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		const resp = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ text }),
		});
		logger.debug('[notifySlack] response received', { status: resp.status });
		if (resp.ok) {
			return;
		}
		if (resp.status !== 429 || attempt === MAX_RETRIES) {
			throw new Error(`Slack webhook failed: HTTP ${resp.status}`);
		}
		const retryAfterHeader = resp.headers.get('retry-after');
		const delayMs =
			retryAfterHeader !== null && retryAfterHeader !== ''
				? Number.parseInt(retryAfterHeader, 10) * 1000
				: FALLBACK_RETRY_DELAY_MS;
		logger.debug('[notifySlack] rate limited, retrying', { attempt, delayMs });
		await sleep(delayMs);
	}
};

export const notifyMattermost = async (
	baseUrl: string,
	token: string,
	channelId: string,
	message: string,
): Promise<void> => {
	logger.debug('[notifyMattermost] posting to channel', { channelId, messageLength: message.length });
	const resp = await fetch(`${baseUrl}/api/v4/posts`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ channel_id: channelId, message }),
	});
	logger.debug('[notifyMattermost] response received', { status: resp.status });
	if (!resp.ok) {
		throw new Error(`Mattermost post failed: HTTP ${resp.status}`);
	}
};
