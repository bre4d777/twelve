import { Message, TextChannel, } from 'discord.js';
import { Command } from '../../types.js';
import { getTicket } from '../../database.js';

const command: Command = {
  name: 'add',
  description: 'Add a user to the current ticket',
  async execute(message: Message, args: string[]) {
    if (!(message.channel instanceof TextChannel)) {
      await message.reply('This command can only be used in text channels');
      return;
    }

    const ticket = getTicket(message.channel.id);
    if (!ticket) {
      await message.reply('This is not a ticket channel');
      return;
    }

    const userId = args[0]?.replace(/[<@!>]/g, '');
    if (!userId) {
      await message.reply('Please mention a user or provide a user ID');
      return;
    }

    try {
      const member = await message.guild?.members.fetch(userId);
      if (!member) {
        await message.reply('User not found');
        return;
      }

      await message.channel.permissionOverwrites.create(member, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
        EmbedLinks: true,
        AddReactions: true,
        UseExternalEmojis: true,
      });

      await message.reply(`Added ${member.user.tag} to this ticket`);
    } catch (error) {
      console.error('Error adding user to ticket:', error);
      await message.reply('Failed to add user to ticket');
    }
  },
};

export default command;
