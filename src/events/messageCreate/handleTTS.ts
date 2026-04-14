import { Message } from 'discord.js';
import { TtsClient } from '../../util/typings.js';
import { connectCheck, startVoiceCall } from '../../util/helpers.js';

export async function execute(client: TtsClient, message: Message<true>) {
	if (message.author.bot) return;
	if (!message.inGuild()) return;
	if (!message.member) return;
	if (!message.channel.isVoiceBased()) return;

	if (message.content === 'join') {
		if (!message.member?.voice.channel) {
			await message.reply('Join a voice channel then try again!');
			return;
		}

		const [allowed, reason] = await connectCheck(client, message.member.voice.channel);
    if (!allowed) {
      message.reply({ content: reason });
      return;
    }

		try {
			await startVoiceCall(client, message.member.voice.channel);
			await message.reply('TTS bot connected and ready');
		} catch (error) {
			/**
			 * Unable to connect to the voice channel within 30 seconds :(
			 */
			console.error(error);
		}

		return;
	}

	if (!message.member.voice || !message.member.voice.channel) {
		return;
	}

	if (message.content === 'leave') {
		if (!message.member.voice.channel) {
			await message.reply('Join a voice channel then try again!');
			return;
		}

		const connectionData = client.playerMap.get(message.member.voice.channelId!);
		if (!connectionData) {
			await message.reply('I am not connected to your voice channel!');
			return;
		}

		connectionData.destroy();
		client.playerMap.delete(message.member.voice.channelId!);

		await message.reply('TTS bot disconnected');
	} else if (message.content === 'stop') {
		const connectionData = client.playerMap.get(message.member.voice.channelId!);
		if (!connectionData) {
			return;
		} else {
			connectionData.stop();
		}
	} else {
		const connectionData = client.playerMap.get(message.member.voice.channelId!);
		if (!connectionData) {
			return;
		} else {
			connectionData.play(client, message);
		}
	}
}
