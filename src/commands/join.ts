import { InteractionContextType, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { connectCheck, startVoiceCall } from '../util/helpers.js';
import { CommandContext } from '../util/typings.js';

export const data = new SlashCommandBuilder()
	.setName('join')
	.setDescription('Joins your current voice channel')
	.setDefaultMemberPermissions(new PermissionsBitField(['Connect', 'Speak']).bitfield)
	.setContexts(InteractionContextType.Guild);
export const execute = async ({ client, interaction }: CommandContext) => {
	if (!interaction.member.voice.channel) {
		await interaction.editReply({ content: 'You need to be in a voice channel to use this command' });
		return;
	}

	const [allowed, reason] = await connectCheck(interaction.guild, interaction.member.voice.channel);
	if (!allowed) {
		interaction.editReply({ content: reason });
		return;
	}

	try {
		await startVoiceCall(client, interaction.member.voice.channel!);
		interaction.editReply({ content: 'Joined voice channel!' });
	} catch (error) {
		console.error('Error starting voice call:', error);
		interaction.editReply({ content: 'Failed to join voice channel. Check permissions' });
	}
};
