import {
	type AudioPlayer,
	AudioPlayerStatus,
	createAudioResource,
	entersState,
	type VoiceConnection,
	VoiceConnectionStatus,
} from '@discordjs/voice';
import { Attachment, type Message } from 'discord.js';
import { getAllAudioUrls } from 'google-tts-api';
import { EventEmitter } from 'node:events';
import { getSettings } from './helpers.js';
import { type TtsClient } from './typings.js';

/**
 * @classdesc A class used to perform text to speech for users in a voice channel. Uses an {@link EventEmitter} to manage the queue and playback of messages.
 * @see {@link TtsPlayer.play()} to add messages to the queue
 */
export class TtsPlayer extends EventEmitter {
	/**
	 * @private
	 * @readonly
	 * @desc The underlying audio player object
	 */
	private readonly player: AudioPlayer;
	/**
	 * @private
	 * @readonly
	 * @desc The underlying voice connection object
	 */
	private readonly connection: VoiceConnection;
	/**
	 * @private
	 * @desc List of messages to be played. New messages can be added using {@link play()}
	 */
	private queue: {
		authorId: string;
		content: string;
		attachments: Map<unknown, Attachment>;
		lang: string;
		nick: string;
	}[] = [];
	/**
	 * @private
	 * @desc Whether the player is looping and playing TTS messages. Acts as a debounce
	 */
	private isPlaying = false;
	/**
	 * @private
	 * @see {@link TtsPlayer.stop()}
	 * @desc Abort controller used to stop playback of TTS messages
	 */
	private controller = new AbortController();
	/**
	 * @private
	 * @desc The ID of the last author read during TTS playback. Used to prevent saying "<username> said" repeatedly
	 */
	private lastAuthor: string | null = null;
	/**
	 * @public
	 * @desc Channel ID for this TTS player
	 */
	set channelId(_newId: string) {
		this.stop();
	}

	/**
	 * @public
	 * @desc Event emitted when a new message is added to the TTS queue. Automatically calls {@link playNext()} to play the message. Consider using {@link play()} to add messages, which is much simpler
	 */
	declare on: (
		eventName: 'queueMessage',
		listener: (client: TtsClient, message: Message<true>) => Promise<void>,
	) => this;
	/**
	 * @public
	 * @see {@link play()}
	 * @desc Adds a new message to the TTS queue. Consider using {@link play()} instead, which is much simpler
	 */
	declare emit: (eventName: 'queueMessage', client: TtsClient, message: Message<true>) => boolean;

	/**
	 * Creates a new TTS player for a specific voice channel. Use {}
	 * @param channelId Channel ID for this palyer
	 * @param connection Voice connection object
	 * @param player Audio player object
	 */
	constructor(channelId: string, connection: VoiceConnection, player: AudioPlayer) {
		super();
		this.connection = connection;
		this.player = player;
		this.channelId = channelId;

		this.on('queueMessage', async (client: TtsClient, message: Message<true>) => {
      const msg = await this.transformMessage(client, message);
			this.queue.push(msg);
			this.playNext();
		});
		this.player.on('error', (error) => {
			console.error('Audio player error:', error);
		});
	}

	/**
	 * @async
	 * @public
	 * @desc Transforms a message to a message payload for the TTS player
	 * @param {TtsClient} client Client with Sequelize data
	 * @param {Message<true>} message Message to convert
	 * @returns {Promise<TtsPlayer['queue'][number]>}
	 */
	public async transformMessage(client: TtsClient, message: Message<true>): Promise<TtsPlayer['queue'][number]> {
		const payload = {
			authorId: message.author.id,
			attachments: message.attachments,
			nick: '',
			lang: '',
			content: '',
		};

		const settings = await getSettings(client, payload.authorId, message.guildId);
		payload.nick = settings.nick || message.member?.displayName || message.author.displayName;
		payload.lang = settings.lang || 'en-GB';

		const mentions = message.mentions;
		payload.content = message.cleanContent.replace(/<(.)(.+?)>/g, function (_, type: string, id: string) {
			let transformed = type + (mentions.members.get(id) || mentions.channels.get(id) || mentions.roles.get(id) || 'mentionable');
      // Try our best to render mentionables we don't understand
      if (transformed.includes('mentionable')) {
        switch(type) {
        case '#': {
          transformed = "#unknown-channel";
          break;
        }
        case '&': {
          transformed = "@unknown-role";
          break;
        }
        case '@': {
          transformed = "@Unknown Member";
          break;
        }
        default: {
          transformed = type + id;
          break;
        }
        }
      }
      return transformed;
		});
		if (message.mentions.repliedUser) {
			//? Is it worth it to get this user's preferred nickname? Or too much DB overhead?
			payload.content = `Replying to ${message.mentions.repliedUser.displayName}: ${payload.content}`;
		}

    // Standard replacements to prevent stupid TTS
		payload.content = payload.content
      // https://stackoverflow.com/a/6041965
			.replaceAll(/(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/gs, 'a link')
			.replaceAll(/```.+?```/gs, 'code block')
      .replaceAll(/`.+?`/gs, 'code snippet');

		return payload;
	}

	/**
	 * @public
	 * @desc Queues a message to be played by the TTS player. Messages will be played in the order received. Use {@link stop()} to stop all playback and clear the queue.
	 */
	public play(client: TtsClient, message: Message<true>) {
		this.emit('queueMessage', client, message);
	}

	/**
	 * @private
	 * Generates the content to send to Google Translate TTS for playback
	 * @param message Message to get the TTS content for
	 */
	private prepareContent(message: TtsPlayer['queue'][number]) {
		let content = [];

		content.push(message.content);

		if (message.authorId !== this.lastAuthor) {
			content.unshift(`${message.nick} said:`);
		}

		if (message.attachments.size > 0) {
			content.push(message.attachments.size === 1 ? 'a file' : 'multiple files');
		}

		return content.join(' ');
	}

	/**
	 * @async
	 * @private
	 * @desc Plays the supplied URLs. Used internally by {@link playNext()} after generating the URLs
	 */
	private async playUrls(urls: string[]) {
		while (urls.length > 0) {
			const url = urls.shift()!;
      this.controller = new AbortController();
			this.player.play(createAudioResource(url));
			await entersState(this.player, AudioPlayerStatus.Idle, this.controller.signal).catch((err) => {
				if (err.name === 'AbortError') {
					urls.length = 0;
					return Promise.resolve();
				} else {
					return Promise.reject(err);
				}
			});
		}
	}

	/**
	 * @async
	 * @private
	 * @see {@link play()}
	 * @desc Plays the next queued TTS message. Will call itself as needed. Use {@link play()} to add messages to the queue
	 */
	private async playNext() {
		if (this.isPlaying || this.queue.length === 0) return;

		this.isPlaying = true;
		try {
      while (this.queue.length > 0) {
        const message = this.queue.shift()!;
        const content = this.prepareContent(message);
  
        this.lastAuthor = message.authorId;
        await this.playUrls(
          getAllAudioUrls(content, {
            lang: message.lang || 'en-GB',
          }).map((obj) => obj.url),
        );
      }
		} catch (err) {
			console.error('Failed to play TTS message:', err);
		} finally {
      this.isPlaying = false;
    }
	}

	/**
	 * @async
	 * @public
	 * @desc Stops playback of all TTS messages
	 */
	public async stop() {
		this.controller.abort();
		this.queue = [];
		this.player.stop();
	}

	/**
	 * @async
	 * @public
	 * @desc Destroys the TTS player and performs cleanup
	 * @param disconnect Whether to disconnect the connection.
	 * Defaults to true to prevent memory leaks
	 */
	public async destroy(disconnect = true) {
		await this.stop();
		if (!disconnect) {
			return;
		}

		this.connection.disconnect();
		if (this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
			this.connection.destroy(false);
		}
	}
}
