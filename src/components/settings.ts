import {
	ButtonInteraction,
	LabelBuilder,
	ModalBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';
import { GTTS_LANGUAGES_MERGED, TtsClient } from '../util/typings.js';

export async function execute(
	_client: TtsClient,
	interaction: StringSelectMenuInteraction<'cached'> | ButtonInteraction<'cached'>,
) {
	const modal = new ModalBuilder();
	const label = new LabelBuilder();

	if (interaction.isStringSelectMenu() && interaction.customId.includes('language')) {
		const reducedList = GTTS_LANGUAGES_MERGED[interaction.values[0]!];
		const dropdown = new StringSelectMenuBuilder()
			.addOptions(
				Object.entries(reducedList!).map(([name, value]) =>
					new StringSelectMenuOptionBuilder().setLabel(name).setValue(value),
				),
			)
			.setCustomId('language');

		label
			.setLabel(`Select ${interaction.values[0]} Dialect`)
			.setDescription('Leave it blank to reset')
			.setStringSelectMenuComponent(dropdown);

		modal.setTitle('Language Dialect Selection').setCustomId('settings_language');
	} else if (interaction.isButton() && interaction.customId.endsWith('nickname')) {
		const input = new TextInputBuilder().setCustomId('nickname').setMaxLength(32).setStyle(TextInputStyle.Short);

		label.setLabel('Enter your nickname').setDescription('Leave it blank to reset').setTextInputComponent(input);
		modal.setTitle('Nickname Selection').setCustomId('settings_nickname');
	}

	modal.setLabelComponents(label);
	interaction.showModal(modal);
}
