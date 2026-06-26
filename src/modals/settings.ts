import { EmbedBuilder, ModalSubmitInteraction } from 'discord.js';
import { type user } from '../models/init-models.js';
import { getSettings } from '../util/helpers.js';
import { TtsClient } from '../util/typings.js';

export async function execute(client: TtsClient, interaction: ModalSubmitInteraction<'cached'>) {
	const field = interaction.fields.fields.first();
	if (!field) {
		console.info('no field found?');
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
    volume: (userData: user) => {
      const userInput = interaction.fields
				.getTextInputValue(field.customId)
        .match(/[0-9](\.[0-9])?/) || ["1.00"];
      let [num, decimal] = Number(userInput[0]).toFixed(2).split('.').map(Number);
      num = Math.max(Math.min(num!, 1), 0)
      decimal = num === 1 ? Math.min(num, 25) : Math.max(num, 25);
      userData.settings[guildId]!.volume = Number(num + '.' + decimal);
    }
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
				[guildId]: {},
			},
		},
	});

	try {
    if (!userData.settings[guildId]) {
      userData.settings[guildId] = {}
    }
		updateFunction(userData);
		userData.changed('settings', true);
		await userData.save();

		await getSettings(client, interaction.user.id, interaction.guildId).then((userSettings) => {
			const embed = new EmbedBuilder()
        .setTitle('Effective Settings')
        .setDescription(
          'Use the provided options to change how the bot speaks as you and says your name. Your current settings are listed below. The bot prefers your global settings if your guild ones are unset',
        )
        .addFields(
          {
            name: 'Nickname',
            value: userSettings.nick || '-> None set! <-',
          },
          {
            name: 'Language',
            value: userSettings.lang || 'en-GB',
          },
          {
            name: 'Volume',
            value: userSettings.volume ? String(userSettings.volume) : '1'
          }
        )
        .setTimestamp();

			interaction.editReply({
				embeds: [embed],
			});
      interaction.followUp({
        content: `Success! Edited your \`${field.customId}\``,
        flags: ['Ephemeral']
      });
		});
	} catch (err) {
		const err_id = btoa(String(Math.floor(Date.now())));
		console.error('Error committing data update', err_id, err);
		interaction.followUp({
			content: `Oh no! Something went wrong. Talk to the developer for help (Error ID: ${err_id})`,
			flags: ['Ephemeral'],
		});
	}
}
