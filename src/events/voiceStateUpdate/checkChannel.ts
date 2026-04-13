import { VoiceState } from "discord.js";
import { TtsClient } from "../../util/typings.js";

export async function execute(client: TtsClient, oldState: VoiceState, _newState: VoiceState) {
  const botChannel = oldState.guild.members.me!.voice.channel
  // TODO: Add auto-join functionality within srv_config?
  if (!oldState.channel || !oldState.member) {
    return;
  }

  if (oldState.member.id === client.user!.id) {
    const player = client.playerMap.get(oldState.channel.id);
    if (!player) {
      return;
    }

    if (!botChannel) {
      player.destroy();
      client.playerMap.delete(oldState.channel.id);
      return;
    } else {
      player.channelId = botChannel.id;
    }
  }

  if (!botChannel) {
    return;
  }

  const player = client.playerMap.get(botChannel.id)
  if (!player) {
    return;
  }

  if (botChannel.members.size > 1) {
    return;
  }
  player.destroy();
}