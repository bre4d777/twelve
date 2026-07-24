import type { Message } from 'discord.js';
import type { Command } from '../types.js';
import { commands } from '../handler.js';
import { config } from '../config.js';

const command: Command = {
  name: 'help',
  description: 'Shows all available commands',
  async execute(message: Message): Promise<void> {
    const commandList = Array.from(commands.values())
      .map(cmd => `${config.prefix}${cmd.name} - ${cmd.description}`)
      .join('\n');

    await message.reply(`>>> ${commandList}`);
  },
};

export default command;
