import { ModalSubmitInteraction } from 'discord.js';
import { type user } from '../models/init-models.js';
import { TtsClient } from '../util/typings.js';

export async function execute(client: TtsClient, interaction: ModalSubmitInteraction<'cached'>) {
	const field = interaction.fields.fields.first();
	if (!field) {
		return;
	}

	const guildId = interaction.inGuild() ? interaction.guildId : '0';
	const settings = {
		nickname: (userData: user) => {
			userData.settings[guildId]!.nick = interaction.fields
				.getTextInputValue(field.customId)
				.replaceAll(/<.+>/g, '')
				.slice(0, 31);
		},
		language: (userData: user) => {
			userData.settings[guildId]!.lang = interaction.fields.getStringSelectValues(field.customId)[0] || 'en-GB';
		},
	} as Record<string, (userData: user) => void>;

	const updateFunction = settings[field.customId];
	if (!updateFunction) {
		return;
	}

	const [userData] = await client.sequelize.models.user.findOrCreate({
		where: {
			userId: interaction.user.id,
		},
    defaults: {
      userId: interaction.user.id,
      settings: {
        [guildId]: {}
      }
    }
	});

	try {
		updateFunction(userData);
		userData.changed('settings', true);
		await userData.save();
	} catch (err) {}
}
