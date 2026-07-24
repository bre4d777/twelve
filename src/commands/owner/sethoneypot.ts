import type { Message, TextChannel } from 'discord.js';
import type { Command } from '../../types.js';
import { setHoneypotChannel, getHoneypotChannel } from '../../database.js';

const command: Command = {
  name: 'sethoneypot',
  description: 'Set honeypot channel ',
  async execute(message: Message, args: string[]): Promise<void> {
    if (!message.guild) {
      await message.reply('This command can only be used in a server');
      return;
    }

    if (args.length === 0) {
      const current = getHoneypotChannel();
      if (current) {
        await message.reply(`Current honeypot channel: <#${current}>`);
      } else {
        await message.reply('No honeypot channel set');
      }
      return;
    }

    const channelId = args[0].replace(/[<#>]/g, '');
    const channel = message.guild.channels.cache.get(channelId);

    if (!channel) {
      await message.reply('Channel not found');
      return;
    }

    if (!channel.isTextBased()) {
      await message.reply('Honeypot must be a text channel');
      return;
    }

    setHoneypotChannel(channelId);
    await message.reply(`Honeypot channel set to <#${channelId}>. Sending warning message...`);

    try {
      const honeypotChannel = channel as TextChannel;
      await honeypotChannel.send(
        '**WARNING** \n\n' +
        'This channel is a honeypot trap for spam bots.\n\n' +
        '**DO NOT POST HERE**\n\n' +
        'Anyone who posts in this channel will be automatically soft-banned ' +
        '(banned and immediately unbanned with messages deleted).\n\n'
      );
    } catch (error) {
      console.error('Failed to send honeypot warning:', error);
      await message.reply('Honeypot set, but failed to send warning message. Check bot permissions.');
    }
  },
};

export default command;
