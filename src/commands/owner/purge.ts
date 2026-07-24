import type { Message } from 'discord.js';
import type { Command } from '../../types.js';

const command: Command = {
  name: 'purge',
  description: 'Delete',
  async execute(message: Message, args: string[]): Promise<void> {
    if (args.length === 0) {
      await message.reply('Usage: purge <amount>');
      return;
    }

    if (!message.guild) {
      await message.reply('This command can only be used in a server');
      return;
    }

    if (!message.channel.isTextBased()) {
      await message.reply('This command can only be used in text channels');
      return;
    }

    const amount = parseInt(args[0]);

    if (isNaN(amount) || amount <= 0 || amount > 100) {
      await message.reply('Please provide a number between 1 and 100');
      return;
    }

    try {
      const channel = message.channel;
      if (!('bulkDelete' in channel)) {
        await message.reply('Cannot bulk delete messages in this channel type');
        return;
      }

      const messages = await channel.bulkDelete(amount + 1, true);

      const reply = await channel.send(`Deleted ${messages.size - 1} messages`);
      setTimeout(() => reply.delete().catch(() => { }), 3000);
    } catch (error) {
      console.error(error);
      await message.reply('Failed to delete messages.');
    }
  },
};

export default command;
