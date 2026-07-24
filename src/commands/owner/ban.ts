import type { Message } from 'discord.js';
import type { Command } from '../../types.js';

const command: Command = {
  name: 'ban',
  description: 'isme kya description du',
  async execute(message: Message, args: string[]): Promise<void> {
    if (args.length === 0) {
      await message.reply('user ya user id toh de ');
      return;
    }

    if (!message.guild) {
      await message.reply('This command can only be used in a server');
      return;
    }

    const userId = args[0].replace(/[<@!>]/g, '');
    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      const member = await message.guild.members.fetch(userId);
      await member.ban({ deleteMessageSeconds: 86400, reason });
      await message.reply(`${member.user.tag} - Reason: ${reason}`);
    } catch (error) {
      console.error(error);
      await message.reply('Failed to ban.');
    }
  },
};

export default command;
