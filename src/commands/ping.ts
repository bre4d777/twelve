import type { Message } from 'discord.js';
import type { Command } from '../types.js';

const command: Command = {
  name: 'ping',
  description: 'Replies with pong and bot latency',
  async execute(message: Message): Promise<void> {
    const sent = await message.reply('Pinging...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    const apiLatency = Math.round(message.client.ws.ping);

    await sent.edit(`Latency: ${latency}ms | API Latency: ${apiLatency}ms`);
  },
};

export default command;
