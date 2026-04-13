import { existsSync, readFileSync, rmSync } from 'node:fs';
import { TtsClient } from '../../util/typings.js';
import { startVoiceCall } from '../../util/helpers.js';

export async function execute(client: TtsClient) {
	if (!existsSync(process.env.CONNECTION_PATH!)) {
		return;
	}

	const connections = JSON.parse(readFileSync(process.env.CONNECTION_PATH!, 'utf-8')) as string[];
	for (const channelId of connections) {
		const channel = await client.channels.fetch(channelId);
		if (!channel || !channel.isVoiceBased()) {
			continue;
		}

		try {
			await startVoiceCall(client, channel);
			console.info(`Reconnected to channel ${channelId}`);
		} catch (error) {
			console.error(`Failed to reconnect to channel ${channelId}:`, error);
		}
	}
	rmSync(process.env.CONNECTION_PATH!);
}
