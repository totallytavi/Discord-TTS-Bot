import { InteractionContextType, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { CommandContext } from '../util/typings.js';

export const data = new SlashCommandBuilder()
	.setName('stop')
	.setDescription('Clears the TTS queue')
	.setDefaultMemberPermissions(new PermissionsBitField(['Connect', 'Speak']).bitfield)
  .setContexts(InteractionContextType.Guild);
export const execute = async ({ client, interaction }: CommandContext) => {
  if (!interaction.member.voice.channel) {
    await interaction.editReply({ content: 'You need to be in a voice channel to use this command' });
    return;
  }

	const botMember = await interaction.guild.members.fetchMe();
	if (!botMember.voice.channelId) {
		await interaction.editReply({ content: "I'm not in a voice channel" });
		return;
	}

	if (!client.playerMap.has(interaction.member.voice.channelId!)) {
    await interaction.editReply({ content: "Something went wrong, I should disconnect shortly" });
    await botMember.voice.setChannel(null, "Unmanaged voice conection");
    return;
  }

  try {
    await client.playerMap.get(interaction.member.voice.channelId!)!.stop();

    interaction.editReply({ content: 'Cleared the queue!' });
  } catch (error) {
    console.error('Error destroying player:', error);
    await interaction.editReply({ content: 'Failed to clear the queue' });
  }
};
