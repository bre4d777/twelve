import type { Message } from 'discord.js';
import type { Command } from '../../types.js';

const command: Command = {
  name: 'rmto',
  description: 'Remove timeout from a user',
  async execute(message: Message, args: string[]): Promise<void> {
    if (args.length === 0) {
      await message.reply('Usage: removetimeout <@user or ID>');
      return;
    }

    if (!message.guild) {
      await message.reply('This command can only be used in a server');
      return;
    }

    const userId = args[0].replace(/[<@!>]/g, '');

    try {
      const member = await message.guild.members.fetch(userId);
      await member.timeout(null);
      await message.reply(`Removed timeout from ${member.user.tag}`);
    } catch (error) {
      console.error(error);
      await message.reply('Failed to remove timeout.');
    }
  },
};

export default command;
