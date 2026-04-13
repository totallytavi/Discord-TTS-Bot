import { InteractionContextType, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { CommandContext } from '../util/typings.js';

export const data = new SlashCommandBuilder()
	.setName('srv_config')
	.setDescription('Configures server settings')
	.setDefaultMemberPermissions(new PermissionsBitField(['ManageGuild']).bitfield)
	.setContexts(InteractionContextType.Guild);
export const execute = async ({ interaction }: CommandContext) => {
  interaction.editReply({ content: "This is pending implementation" });
	// TODO: Add server configuration and Sequelize connection data
};
