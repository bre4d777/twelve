import type { Message } from 'discord.js';
import type { Command } from '../../types.js';
import { config } from '../../config.js';
import { PREMIUM_TIERS } from '../../database.js';

const command: Command = {
  name: 'grant',
  description: 'Grant premium tier to a user',
  async execute(message: Message, args: string[]): Promise<void> {
    if (!message.guild) {
      await message.reply('This command can only be used in a server');
      return;
    }

    if (args.length < 2) {
      await message.reply(
        { content: 'Usage: grant <@user or ID> <lite|basic|premium>\n' }
      );
      return;
    }

    const userId = args[0].replace(/[<@!>]/g, '');
    const tierInput = args[1].toLowerCase();

    let tier: string;
    let roleId: string | null;

    if (tierInput === 'lite') {
      tier = 'lite';
      roleId = config.premiumRoles.lite;
    } else if (tierInput === 'basic' || tierInput === 'standard') {
      tier = 'basic';
      roleId = config.premiumRoles.basic;
    } else if (tierInput === 'premium' || tierInput === 'ultra') {
      tier = 'premium';
      roleId = config.premiumRoles.premium;
    } else {
      await message.reply('Invalid tier. Use: lite, basic, or premium');
      return;
    }

    if (!roleId) {
      await message.reply(`Role for ${tier} tier is not configured `);
      return;
    }

    try {
      const member = await message.guild.members.fetch(userId);

      await member.roles.add(roleId);

      const tierInfo = Object.values(PREMIUM_TIERS).find(t => t.id === tier);
      await message.reply(
        `Granted ${tierInfo?.name || tier} tier to ${member.user.tag}\n`
      );
    } catch (error) {
      console.error(error);
      await message.reply('Failed to grant premium.');
    }
  },
};

export default command;
