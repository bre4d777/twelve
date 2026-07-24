import type { Message } from 'discord.js';
import type { Command } from '../../types.js';

function parseDuration(input: string): number | null {
  const regex = /^(\d+)([smhdw])$/i;
  const match = input.match(regex);

  if (!match) {
    return null;
  }

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}

const command: Command = {
  name: 'chup',
  description: 'Timeout a user',
  async execute(message: Message, args: string[]): Promise<void> {
    if (args.length < 2) {
      await message.reply('Usage: chup <@user or ID> <duration>');
      return;
    }

    if (!message.guild) {
      await message.reply('This command can only be used in a server');
      return;
    }

    const userId = args[0].replace(/[<@!>]/g, '');
    const durationInput = args[1];
    const reason = args.slice(2).join(' ') || 'No reason provided';

    const durationMs = parseDuration(durationInput);

    if (!durationMs) {
      await message.reply('Invalid duration format. Use: 1h, 30m, 2d, 1w, 15s');
      return;
    }

    const maxDuration = 28 * 24 * 60 * 60 * 1000;
    if (durationMs > maxDuration) {
      await message.reply('Maximum timeout duration is 28 days (4w)');
      return;
    }

    if (durationMs < 1000) {
      await message.reply('Minimum timeout duration is 1 second');
      return;
    }

    try {
      const member = await message.guild.members.fetch(userId);
      await member.timeout(durationMs, reason);

      const durationText = durationInput;
      await message.reply(`Timed out ${member.user.tag} for ${durationText} - Reason: ${reason}`);
    } catch (error) {
      console.error(error);
      await message.reply('Failed to timeout user.');
    }
  },
};

export default command;
