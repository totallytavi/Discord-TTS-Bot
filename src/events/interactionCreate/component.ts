import { type ButtonInteraction, type Interaction, type StringSelectMenuInteraction } from 'discord.js';
import { readdirSync } from 'node:fs';
import { fsRelativeDir, relativeDir } from '../../util/helpers.js';
import { type TtsClient } from '../../util/typings.js';

const components = new Map<string, { execute: (client: TtsClient, interaction: Interaction) => Promise<void> }>();
for (const handler of readdirSync(fsRelativeDir('./components')).filter((f) => f.endsWith('.js'))) {
	try {
		const file = await import(relativeDir('./components', handler));
		if (file.execute && file.data) {
			components.set(handler.replace('.js', ''), file);
		}
	} catch (err) {
		console.error(`Failed to load component ${handler}:`, err);
	}
}

export async function execute(
	client: TtsClient,
	interaction: ButtonInteraction<'cached'> | StringSelectMenuInteraction<'cached'>,
) {
	if (!interaction.isMessageComponent()) {
		return;
	}

	const handler = components.get(interaction.customId.split('_')[0]!);
	if (!handler) {
		return;
	} else {
    try {
      await interaction.deferUpdate();
			await handler.execute(client, interaction);
		} catch (err) {
			console.error('Failed to run command', err);
			interaction.update({
				content: 'An error occurred, please try again',
				components: [],
				embeds: [],
			});
		}
	}
}
