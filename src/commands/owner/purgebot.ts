import type { Message } from 'discord.js';
import type { Command } from '../../types.js';

const command: Command = {
  name: 'pb',
  description: 'Delete only bot messages in channel',
  async execute(message: Message, args: string[]): Promise<void> {
    if (!message.guild) {
      await message.reply('This command can only be used in a server');
      return;
    }

    if (!message.channel.isTextBased()) {
      await message.reply('This command can only be used in text channels');
      return;
    }

    const amount = args.length > 0 ? parseInt(args[0]) : 50;

    if (isNaN(amount) || amount <= 0 || amount > 100) {
      await message.reply('Please provide a number between 1 and 100');
      return;
    }

    try {
      const channel = message.channel;

      if (!('messages' in channel) || !('bulkDelete' in channel)) {
        await message.reply('Cannot fetch or bulk delete messages in this channel type');
        return;
      }

      const messages = await channel.messages.fetch({ limit: amount });

      const botMessages = messages.filter(msg => msg.author.bot);

      if (botMessages.size === 0) {
        await message.reply('No bot messages found');
        return;
      }

      await channel.bulkDelete(botMessages, true);

      const reply = await channel.send(`Deleted ${botMessages.size} bot messages`);
      setTimeout(() => reply.delete().catch(() => { }), 3000);
    } catch (error) {
      console.error(error);
      await message.reply('Failed to delete messages.');
    }
  },
};

export default command;
