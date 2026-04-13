import { AudioPlayer, AudioPlayerStatus, createAudioResource, entersState, VoiceConnection } from '@discordjs/voice';
import { EventEmitter } from 'node:events';
import { getAllAudioUrls } from 'google-tts-api';
import { type Message } from 'discord.js';

/**
 * @classdesc A class used to perform text to speech for users in a voice channel. Uses an {@link EventEmitter} to manage the queue and playback of messages.
 * @see {@link TtsPlayer.play()} to add messages to the queue
 */
export class TtsPlayer extends EventEmitter {
	/**
	 * @private
	 * @desc The underlying audio player object
	 */
	private player: AudioPlayer;
	/**
	 * @private
	 * @desc The underlying voice connection object
	 */
	private connection: VoiceConnection;
	/**
	 * @private
	 * @desc List of messages to be played. New messages can be added using {@link }
	 */
	// TODO: Consider changing this to a table that just contains the content, author ID, nickname, and lang to reduce storage needs and allow customization
	private queue: Message<true>[] = [];
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
	public channelId: string;

	/**
	 * @public
	 * @desc Event emitted when a new message is added to the TTS queue. Automatically calls {@link playNext()} to play the message. Consider using {@link play()} to add messages, which is much simpler
	 */
	declare on: (eventName: 'messageCreate', listener: (message: Message<true>) => void) => this;
	/**
	 * @public
	 * @see {@link play()}
	 * @desc Adds a new message to the TTS queue. Consider using {@link play()} instead, which is much simpler
	 */
	declare emit: (eventName: 'messageCreate', message: Message<true>) => boolean;

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

		this.on('messageCreate', (message) => {
			this.queue.push(message);
			this.playNext();
		});
		this.player.on('error', (error) => {
			console.error('Audio player error:', error);
		});
	}

	/**
	 * @public
	 * @desc Queues a message to be played by the TTS player. Messages will be played in the order received. Use {@link stop()} to stop all playback and clear the queue.
	 */
	public play(message: Message<true>) {
		this.emit('messageCreate', message);
	}

	/**
	 * Generates the content to send to Google Translate TTS for playback
	 * @param message Message to get the TTS content for
	 */
	private prepareContent(message: TtsPlayer['queue'][number]) {
		let content = [];

    // TODO: Map mentionables to their names
		content.push(message.cleanContent.replaceAll(/<.+?>/g, '[mentionable]'));

		if (message.author.id !== this.lastAuthor) {
			content.unshift(`${message.member!.displayName} said:`);
		}

		if (message.attachments.size > 0) {
      //? Consider a better way to detect if we should
      //? put "with"
      if (message.cleanContent.length > 3) {
        content.push('with:');
      }

			for (const attachment of message.attachments.values()) {
				if (attachment.contentType?.startsWith('audio/')) {
					content.push(`an audio file named ${attachment.name},`);
				} else {
					content.push(`a file named ${attachment.name},`);
				}
			}
			if (message.attachments.size > 1) {
				content[content.length - 1] = content[content.length - 1]!.slice(0, -1) + ' and';
			}
		}

		return content.join(' ');
	}

	/**
	 * @private
	 * @desc Plays the supplied URLs. Used internally by {@link playNext()} after generating the URLs
	 */
	private async playUrls(urls: string[]) {
		while (urls.length > 0) {
			const url = urls.shift()!;
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
	 * @private
	 * @see {@link play()}
	 * @desc Plays the next queued TTS message. Will call itself as needed. Use {@link play()} to add messages to the queue
	 */
	private async playNext() {
		if (this.isPlaying || this.queue.length === 0) return;

		this.isPlaying = true;
		const message = this.queue.shift()!;
		// TODO: Move this whole block into a separate function to clean it up?
		try {
			const content = this.prepareContent(message);

			let language = 'en-GB';
			const langRole = message.member!.roles.cache.find((r) => r.name.startsWith('lang-'));
			if (langRole && langRole.name.match(/^lang-([a-z]{2}-[A-Z]{2})$/)) {
				// TODO: Add a property called ttsLang from a database
				language = langRole.name.slice(5);
			}

			this.lastAuthor = message.author.id;
			await this.playUrls(
				getAllAudioUrls(content, {
					lang: language,
				}).map((obj) => obj.url),
			);
		} catch (err) {
			console.error('Failed to play TTS message:', err);
		}

		this.isPlaying = false;
		this.playNext();
	}

	/**
	 * @public
	 * @desc Stops playback of all TTS messages
	 */
	public async stop() {
		this.controller.abort();
		this.queue = [];
		this.player.stop();
	}

	/**
	 * @public
	 * @desc Destroys the TTS player and performs cleanup
	 * @param disconnect Whether to disconnect the connection.
	 * Defaults to true to prevent memory leaks
	 */
	public async destroy(disconnect = true) {
		await this.stop();
		if (disconnect) {
			this.connection.disconnect();
			this.connection.destroy(false);
		}
	}
}
