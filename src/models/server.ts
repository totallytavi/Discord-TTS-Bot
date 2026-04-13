import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface serverAttributes {
	guildId: string;
	settings: serverConfig;
}

/**
 * The configuration data of the server
 */
export interface serverConfig {
	/**
	 * Channel which always reads text to speech messages from. Messages from this channel and the channel the bot is in will be read
	 */
	ttsChannel?: string;
}

export type serverPk = 'guildId';
export type serverId = server[serverPk];
export type serverOptionalAttributes = 'settings';
export type serverCreationAttributes = Optional<serverAttributes, serverOptionalAttributes>;

export class server extends Model<serverAttributes, serverCreationAttributes> implements serverAttributes {
	declare guildId: string;
	declare settings: serverConfig;
	declare createdAt: Date;
	declare updatedAt: Date;

	static initModel(sequelize: Sequelize.Sequelize): typeof server {
		return server.init(
			{
				guildId: {
					type: DataTypes.STRING(22),
					allowNull: false,
					primaryKey: true,
				},
				settings: {
					type: DataTypes.JSON,
					allowNull: false,
          defaultValue: {}
				},
			},
			{
				sequelize,
				tableName: 'server',
				timestamps: true,
				indexes: [
					{
						name: 'PRIMARY',
						unique: true,
						using: 'BTREE',
						fields: [{ name: 'guildId' }],
					},
				],
			},
		);
	}
}
