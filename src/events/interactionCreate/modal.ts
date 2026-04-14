import { type ModalSubmitInteraction } from 'discord.js';
import { readdirSync } from 'node:fs';
import { fsRelativeDir, relativeDir } from '../../util/helpers.js';
import { type TtsClient } from '../../util/typings.js';

const modals = new Map<string, { execute: (client: TtsClient, interaction: ModalSubmitInteraction) => Promise<void> }>();
for (const handler of readdirSync(fsRelativeDir('./modals')).filter((f) => f.endsWith('.js'))) {
  try {
    const file = await import(relativeDir('./modals', handler));
    if (file.execute) {
      modals.set(handler.replace('.js', ''), file);
    }
  } catch (err) {
    console.error(`Failed to load component ${handler}:`, err);
  }
}

export async function execute(
  client: TtsClient,
  interaction: ModalSubmitInteraction<'cached'>,
) {
  if (!interaction.isModalSubmit()) {
    return;
  }

  const handler = modals.get(interaction.customId.split('_')[0]!);
  if (!handler) {
    console.info('no handler!', interaction.customId);
    return;
  } else {
    try {
      await interaction.deferUpdate();
      await handler.execute(client, interaction);
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
