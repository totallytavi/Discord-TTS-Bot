import { ChatInputCommandInteraction } from 'discord.js';
import { readdirSync } from 'node:fs';
import { fsRelativeDir, relativeDir } from '../../util/helpers.js';
import { CommandContext, TtsClient } from '../../util/typings.js';

const commands = new Map<string, { execute: (context: CommandContext) => Promise<void> }>();
for (const handler of readdirSync(fsRelativeDir('./commands')).filter((f) => f.endsWith('.js'))) {
	try {
		const file = await import(relativeDir('./commands', handler));
    if (file.execute && file.data) {
      commands.set(handler.replace('.js', ''), file);
    }
	} catch (err) {
		console.error(`Failed to load command ${handler}:`, err);
	}
}

export async function execute(client: TtsClient, interaction: ChatInputCommandInteraction<'cached'>) {
	if (!interaction.isChatInputCommand()) {
		return;
	}

	const handler = commands.get(interaction.commandName);
	if (!handler) {
		return;
	} else {
    try {
      await interaction.deferReply({ flags: ['Ephemeral'] });
			await handler.execute({ client, interaction });
		} catch (err) {
			console.error('Failed to run command', err);
			interaction.editReply({
				content: 'An error occurred, please try again',
				components: [],
				embeds: [],
			});
		}
	}
}
