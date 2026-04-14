import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	InteractionContextType,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from 'discord.js';
import { reduceLanguageList } from '../util/helpers.js';
import { CommandContext } from '../util/typings.js';

export const data = new SlashCommandBuilder()
	.setName('usr_config')
	.setDescription('Configures your user settings')
	.setContexts(InteractionContextType.BotDM, InteractionContextType.Guild);
export const execute = async ({ interaction }: CommandContext) => {
	const components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = [];
	const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder().setLabel('Change nickname').setCustomId('settings_nickname').setStyle(ButtonStyle.Primary),
	);
	components.push(buttonRow);

	reduceLanguageList().forEach((languageList, index) => {
		const options = languageList.map((language) =>
			new StringSelectMenuOptionBuilder().setLabel(language).setValue(language),
		);

		const menu = new StringSelectMenuBuilder()
			.setCustomId('settings_language' + index)
			.setOptions(options)
			.setPlaceholder('Select a language' + (index > 0 ? ' (cont.)' : ''));

		components.push(new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(menu));
	});

	interaction.editReply({
		embeds: [
			new EmbedBuilder()
				.setTitle('User Settings')
				.setDescription(
					'Use the provided options to change how the bot speaks as you and says your name. Please note: Certain languages feature dialects. You will be prompted to select a specific one',
				),
		],
		components,
	});
};
