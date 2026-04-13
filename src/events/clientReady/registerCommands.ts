import { readdirSync } from 'node:fs';
import { fsRelativeDir, relativeDir } from '../../util/helpers.js';
import { TtsClient } from '../../util/typings.js';

export async function execute(client: TtsClient) {
	if (!client.application) {
		return;
	}

	const commands = [];
	for (const handler of readdirSync(fsRelativeDir('./commands')).filter((f) => f.endsWith('.js'))) {
		try {
			const file = await import(relativeDir('./commands', handler));
			if (file.data) {
				commands.push(file.data.toJSON());
			}
		} catch (err) {
			console.error(`Failed to load command ${handler}:`, err);
		}
	}
	client.application.commands.set(commands);
	console.info('Registered ' + commands.length + ' commands for use!');
}
