import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface userAttributes {
	userId: string;
  // Key is the guild ID, where 0 is global
	settings: Record<string, userSettings>;
}

/**
 * Settings for a user
 */
export interface userSettings {
	/**
	 * Preferred nickname of the user. Used when reading their name for TTS messages
	 */
	nick?: string;
	/**
	 * Preferred language of the user
	 */
	lang?: string;
}

export type userPk = 'userId';
export type userId = user[userPk];
export type userOptionalAttributes = 'settings';
export type userCreationAttributes = Optional<userAttributes, userOptionalAttributes>;

export class user extends Model<userAttributes, userCreationAttributes> implements userAttributes {
	declare userId: string;
	declare settings: Record<string, userSettings>;
	declare createdAt: Date;
	declare updatedAt: Date;

	static initModel(sequelize: Sequelize.Sequelize): typeof user {
		return user.init(
			{
				userId: {
					type: DataTypes.STRING(22),
					allowNull: false,
					primaryKey: true,
				},
				settings: {
					type: DataTypes.JSON,
					allowNull: false,
				},
			},
			{
				sequelize,
				tableName: 'user',
				timestamps: true,
				indexes: [
					{
						name: 'PRIMARY',
						unique: true,
						using: 'BTREE',
						fields: [{ name: 'userId' }],
					},
				],
			},
		);
	}
}
