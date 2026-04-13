import type { Sequelize } from 'sequelize';
import { server as _server } from './server.js';
import type { serverAttributes, serverCreationAttributes } from './server.js';
import { user as _user } from './user.js';
import type { userAttributes, userCreationAttributes } from './user.js';

export { _server as server, _user as user };

export type { serverAttributes, serverCreationAttributes, userAttributes, userCreationAttributes };

export function initModels(sequelize: Sequelize) {
	const server = _server.initModel(sequelize);
	const user = _user.initModel(sequelize);

	return {
		server: server,
		user: user,
	};
}
