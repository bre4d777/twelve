import { Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { Command } from '../types.js';
import { config } from '../config.js';

const command: Command = {
  name: 'panel',
  description: 'Send the ticket panel in the current channel',
  async execute(message: Message) {
    const member = message.member;
    if (!member) {
      await message.reply('Unable to verify permissions');
      return;
    }

    if (!member.roles.cache.has(config.ownerRoleId)) {
      await message.reply('You do not have permission to use this command');
      return;
    }

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    let currentRow = new ActionRowBuilder<ButtonBuilder>();

    config.tickets.categories.forEach((category, index) => {
      const button = new ButtonBuilder()
        .setCustomId(`ticket_create_${category.prefix}`)
        .setLabel(category.name)
        .setStyle(ButtonStyle.Primary);

      currentRow.addComponents(button);

      if ((index + 1) % 2 === 0 || index === config.tickets.categories.length - 1) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder<ButtonBuilder>();
      }
    });

    if (message.channel instanceof TextChannel) {
      await message.channel.send({
        content:
          '**Support Ticket System**\n\n' +
          'Need help? Click one of the buttons below to create a support ticket!\n\n' +
          'Bug Report - Report a bug or issue\n' +
          'Feedback/Suggestion - Share your ideas\n' +
          'Buy Premium - Get premium membership\n' +
          'General Query - Ask anything else\n\n' +
          'A staff member will be with you shortly!',
        components: rows,
      });
    }

    if (message.deletable) {
      await message.delete();
    }
  },
};

export default command;
