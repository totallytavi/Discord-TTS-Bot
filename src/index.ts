import { Client, GatewayIntentBits } from 'discord.js';
import { readdirSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { Sequelize } from 'sequelize';
import { initModels } from './models/init-models.js';
import { fsRelativeDir, relativeDir } from './util/helpers.js';
import { type TtsPlayer } from './util/TtsPlayer.js';
import { TtsClient } from './util/typings.js';

await import('dotenv').then((dotenv) => dotenv.config());

if (!process.env.CONNECTION_PATH) {
	process.env.CONNECTION_PATH = fsRelativeDir('../connections.json');
}

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.MessageContent,
	],
}) as TtsClient;
const sequelize = new Sequelize({
	host: process.env.DB_HOST!,
	username: process.env.DB_USER!,
	password: process.env.DB_PASS!,
	database: process.env.DB_DATABASE!,
	port: Number(process.env.DB_PORT),
	dialect: 'mysql',
});
client.playerMap = new Map<string, TtsPlayer>();
client.sequelize = sequelize as unknown as (typeof client)['sequelize'];
client.commands = new Map();

try {
	await sequelize.authenticate();
	initModels(sequelize);
	await sequelize.sync();
} catch (err) {
	console.error('Database failed to load', err);
}

for (const event of readdirSync(fsRelativeDir('./events'))) {
	for (const file of readdirSync(fsRelativeDir(`./events/${event}`)).filter((f) => f.endsWith('.js'))) {
		try {
			const data = await import(relativeDir(`./events/${event}/${file}`));
			client.on(event, (...args) => data.execute(client, ...args));
		} catch (err) {
			console.error(`Failed to load ${event} handler ${file}:\n\t`, err);
		}
	}
}

process.on('SIGINT', async () => {
	console.info('SIGINT received, pre-exit cleanup...');
	const channels = [];
	for (const player of client.playerMap.values()) {
		channels.push(player.channelId);
    // Don't destroy so a brief restart won't be noticed
    // by users. Memory cleanup is handled on exit
		await player.destroy(false);
	}
	client.playerMap.clear();
	writeFileSync(process.env.CONNECTION_PATH!, JSON.stringify(channels), 'utf-8');
	console.log('Cleanup complete, saved all connections to connections.json');
	process.exit(0);
});

console.info(`Token: ${process.env.TOKEN?.slice(0, 10)}...`);
await client.login(process.env.TOKEN);
