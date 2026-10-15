import { Message, TextBasedChannel } from 'discord.js';
import { TtsClient } from '../../util/typings.js';

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

	if (!message.member.voice || !message.member.voice.channel) {
		return;
	}

	// Block server muted members from speaking
	if (message.member.voice.serverMute) {
		return;
	}

	if (message.content === 'join' || message.content === 'leave' || message.content === 'stop') {
		send(message.channel, 'Text-based commands are deprecated. Please use the equivalent slash commands');
		return;
	}

	const connectionData = client.playerMap.get(message.member.voice.channelId!);
	if (!connectionData) {
		return;
	} else {
		connectionData.play(client, message);
	}
}
