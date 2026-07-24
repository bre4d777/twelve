import type { Message } from 'discord.js';
import type { Command } from '../../types.js';
import { setHoneypotChannel, getHoneypotChannel } from '../../database.js';

const command: Command = {
  name: 'removehoneypot',
  description: 'Remove honeypot channel',
  async execute(message: Message): Promise<void> {
    if (!message.guild) {
      await message.reply('This command can only be used in a server');
      return;
    }

    const current = getHoneypotChannel();

    if (!current) {
      await message.reply('No honeypot channel is currently set');
      return;
    }

    setHoneypotChannel(null);
    await message.reply(`Honeypot channel <#${current}> has been removed`);
  },
};

export default command;
