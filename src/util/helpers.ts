import { VoiceConnectionStatus, createAudioPlayer, entersState, joinVoiceChannel } from '@discordjs/voice';
import type { Guild, VoiceBasedChannel } from 'discord.js';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { type userSettings } from '../models/user.js';
import { createDiscordJSAdapter } from './adapter.js';
import { TtsPlayer } from './TtsPlayer.js';
import { GTTS_LANGUAGES_MERGED, type TtsClient } from './typings.js';

export async function connectToChannel(channel: VoiceBasedChannel) {
	/**
	 * Here, we try to establish a connection to a voice channel. If we're already connected
	 * to this voice channel, \@discordjs/voice will just return the existing connection for us!
	 */
	const connection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: createDiscordJSAdapter(channel),
	});

	/**
	 * If we're dealing with a connection that isn't yet Ready, we can set a reasonable
	 * time limit before giving up. In this example, we give the voice connection 30 seconds
	 * to enter the ready state before giving up.
	 */
	try {
		/**
		 * Allow ourselves 30 seconds to join the voice channel. If we do not join within then,
		 * an error is thrown.
		 */
		await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
		/**
		 * At this point, the voice connection is ready within 30 seconds! This means we can
		 * start playing audio in the voice channel. We return the connection so it can be
		 * used by the caller.
		 */
		return connection;
	} catch (error) {
		/**
		 * At this point, the voice connection has not entered the Ready state. We should make
		 * sure to destroy it, and propagate the error by throwing it, so that the calling function
		 * is aware that we failed to connect to the channel.
		 */
		connection.destroy();

		throw error;
	}
}

export function waitForFirst(...signals: Promise<void>[] | AbortSignal[]) {
	return new Promise<void>((resolve) => {
		for (const signal of signals) {
			if (signal instanceof Promise) {
				signal.then(() => resolve()).catch(() => {});
				continue;
			} else {
				if (signal.aborted) {
					resolve();
					return;
				}

				signal.addEventListener('abort', () => resolve(), { once: true });
			}
		}
	});
}

export async function startVoiceCall(client: TtsClient, channel: VoiceBasedChannel) {
	const connection = await connectToChannel(channel);

	const player = createAudioPlayer();
	connection.subscribe(player);
	client.playerMap.set(channel.id, new TtsPlayer(channel.id, connection, player));

	return connection;
}

/**
 * Fetches a user's settings, giving priority to their guild settings
 * @param client Client with Sequelize models loaded
 * @param userId User ID to get the settings for
 * @param guildId Guild ID to get the settings for, defaults to 0 (Global)
 * @returns A copy of the user's settings, giving priority to their guild over global settings
 */
export async function getSettings(client: TtsClient, userId: string, guildId = '0'): Promise<userSettings> {
	const userData = await client.sequelize.models.user.findByPk(userId);
	if (!userData) {
		return {};
	}

	return {
		// We spread the settings of the global first, then guild specific
		...userData.settings['0'],
		...userData.settings[guildId],
	};
}

/**
 * Converts the {@link GTTS_LANGUAGES_MERGED language list} to a list suitable
 * for use with an {@link StringSelectMenuOptionBuilder}
 * @returns {string[][]} A list of all the top-level languages, separated into
 * groups of 25 or less.
 */
export function reduceLanguageList(): string[][] {
	const keys = Object.keys(GTTS_LANGUAGES_MERGED);
	const list: string[][] = [];

	for (let i = 0; i < keys.length; i += 25) {
		list.push(keys.slice(i, i + 25));
	}

	return list;
}

export async function connectCheck(guild: Guild, channel: VoiceBasedChannel): Promise<[boolean, string]> {
	const botMember = guild.members.me!;
	if (!guild.members.me!.voice.channel) {
		if (!channel.permissionsFor(botMember).has(['ViewChannel', 'ReadMessageHistory'])) {
			return [false, 'Missing permissions to view voice channel and its text chat'];
		}
		if (!channel.permissionsFor(botMember).has(['Connect', 'Speak'])) {
			return [false, 'Missing permissions to view VC and speak'];
		}

		return [true, 'Not in VC yet'];
	}

	if (botMember.voice.channel !== channel) {
		return [false, "I'm in a differnt VC!"];
	} else {
		return [false, "I'm already in your VC!"];
	}
}

/**
 * Converts a relative directory to a well formatted path for node:fs.
 * Do NOT use this for {@link import()}, use {@link relativeDir()}
 * @param dir Spread array of directories
 * @returns {string} Well formatted string for use in node:fs
 */
export const fsRelativeDir = (...dir: string[]) => path.join(import.meta.dirname, '..', ...dir);

/**
 * Converts a relative directory to a well formatted path for {@link import()}.
 * Do NOT use this for node:fs functions, use {@link fsRelativeDir()}
 * @param dir Spread array of directories
 * @returns {string} Well formatted string for use in {@link import()}
 */
export const relativeDir = (...dir: string[]) => pathToFileURL(path.join(import.meta.dirname, '..', ...dir)).href;
