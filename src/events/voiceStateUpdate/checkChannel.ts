import { VoiceState } from 'discord.js';
import { TtsClient } from '../../util/typings.js';

export async function execute(client: TtsClient, oldState: VoiceState, newState: VoiceState) {
	const oldChannel = oldState.channel;
	// TODO: Add auto-join functionality within srv_config?
	if (!oldChannel || !oldState.member) {
		return;
	}

	if (oldState.member.id === client.user!.id) {
		const player = client.playerMap.get(oldState.channel.id);
		if (!player) {
			return;
		}

		if (!newState.channelId) {
      void player.destroy();
      return;
    }

    if (newState.channelId !== oldChannel.id) {
      client.playerMap.delete(oldChannel.id);
      client.playerMap.set(newState.channelId, player);
      player.channelId = newState.channelId;
    }
	}

	const botChannel = oldState.guild.members.me!.voice.channel;
	if (!botChannel) {
		return;
	}

	const player = client.playerMap.get(botChannel.id);
	if (!player) {
		return;
	}
  const callMembers = botChannel.members.filter((member) => !member.user.bot)
	if (callMembers.size > 1) {
		return;
	}

	void player.destroy();
}
