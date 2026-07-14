import { Message, TextBasedChannel } from 'discord.js';
import { TtsClient } from '../../util/typings.js';
import { connectCheck, startVoiceCall } from '../../util/helpers.js';

async function send(channel: TextBasedChannel, content: string): Promise<Message | void> {
	if (!channel.isTextBased()) return;
	if (!channel.isSendable()) return;

	return channel.send({ content }).catch((error) => console.error('Failed to safely send message', error));
}

export async function execute(client: TtsClient, message: Message<true>) {
	if (message.author.bot) return;
	if (!message.inGuild()) return;
	if (!message.member) return;
	if (!message.channel.isVoiceBased()) return;

	// Silence TTS on these messages
	if (message.cleanContent.startsWith('-')) return;

	if (message.content === 'join') {
		if (!message.member?.voice.channel) {
			send(message.channel, 'Join a voice channel then try again!');
			return;
		}

		const [allowed, reason] = await connectCheck(client, message.member.voice.channel);
		if (!allowed) {
			send(message.channel, reason);
			return;
		}

		try {
			await startVoiceCall(client, message.member.voice.channel);
			await send(message.channel, 'TTS bot connected and ready');
			await send(message.channel, 'Text-based commands are being deprecated. Please use slash commands instead (/join)');
		} catch (error) {
			/**
			 * Unable to connect to the voice channel within 30 seconds :(
			 */
			console.error(error);
			await send(message.channel, 'Failed to connect. Please try again later');
		}

		return;
	}

	if (!message.member.voice || !message.member.voice.channel) {
		return;
	}

	// Block server muted members from speaking
	if (message.member.voice.serverMute) {
		return;
	}

	if (message.content === 'leave') {
		if (!message.member.voice.channel) {
			await send(message.channel, 'Join a voice channel then try again!');
			return;
		}

		const connectionData = client.playerMap.get(message.member.voice.channelId!);
		if (!connectionData) {
			await send(message.channel, 'I am not connected to your voice channel!');
			return;
		}

		await connectionData.destroy();
		client.playerMap.delete(message.member.voice.channelId!);

		await send(message.channel, 'TTS bot disconnected');
		await send(message.channel, 'Text-based commands are being deprecated. Please use slash commands instead (/leave)');
	} else if (message.content === 'stop') {
		const connectionData = client.playerMap.get(message.member.voice.channelId!);
		if (!connectionData) {
			return;
		} else {
			await connectionData.stop();
		}
		await send(message.channel, 'Text-based commands are being deprecated. Please use slash commands instead (/stop)');
	} else {
		const connectionData = client.playerMap.get(message.member.voice.channelId!);
		if (!connectionData) {
			return;
		} else {
			connectionData.play(client, message);
		}
	}
}
