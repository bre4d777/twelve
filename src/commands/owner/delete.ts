import { Message, TextChannel } from 'discord.js';
import { Command } from '../../types.js';
import { getTicket, removeTicket } from '../../database.js';

const command: Command = {
  name: 'delete',
  description: 'Delete the current ticket',
  async execute(message: Message) {
    if (!(message.channel instanceof TextChannel)) {
      await message.reply('This command can only be used in text channels');
      return;
    }

    const ticket = getTicket(message.channel.id);
    if (!ticket) {
      await message.reply('This is not a ticket channel');
      return;
    }

    await message.reply('Deleting this ticket in 3 seconds...');

    setTimeout(async () => {
      try {
        removeTicket(message.channel.id);
        await message.channel.delete();
      } catch (error) {
        console.error('Error deleting ticket:', error);
      }
    }, 3000);
  },
};

export default command;
