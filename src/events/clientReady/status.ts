import { ActivityOptions, ActivityType } from 'discord.js';
import { type TtsClient } from '../../util/typings.js';

export async function execute(client: TtsClient) {
	const STATUS_OPTIONS: ActivityOptions[] = [
		{
			name: 'for messages in VC text chat',
			type: ActivityType.Listening,
		},
		{
			name: 'your messages in VC text chat',
			type: ActivityType.Watching,
		},
		{
			name: 'Reading your text messages in voice calls',
			type: ActivityType.Custom,
		},
	];

	function pickRandomStatus() {
		if (!client.user) {
			return;
		}

		client.user.setActivity(STATUS_OPTIONS[Math.floor(Math.random() * STATUS_OPTIONS.length)]);
	}

	setInterval(() => pickRandomStatus(), 60 * 60 * 1000);
  pickRandomStatus();
}
