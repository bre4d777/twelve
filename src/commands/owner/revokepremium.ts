import type { Message } from 'discord.js';
import type { Command } from '../../types.js';
import { config } from '../../config.js';

const command: Command = {
  name: 'revoke',
  description: 'Revoke premium tier from a user',
  async execute(message: Message, args: string[]): Promise<void> {
    if (!message.guild) {
      await message.reply('This command can only be used in a server');
      return;
    }

    if (args.length === 0) {
      await message.reply('Usage: revoke <@user or ID>');
      return;
    }

    const userId = args[0].replace(/[<@!>]/g, '');

    try {
      const member = await message.guild.members.fetch(userId);

      const rolesToRemove = [
        config.premiumRoles.lite,
        config.premiumRoles.basic,
        config.premiumRoles.premium,
      ].filter((id): id is string => id !== null);

      if (rolesToRemove.length === 0) {
        await message.reply('No premium roles configured');
        return;
      }

      const hadRoles = rolesToRemove.some(roleId => member.roles.cache.has(roleId));

      if (!hadRoles) {
        await message.reply(`${member.user.tag} does not have any premium roles`);
        return;
      }

      await member.roles.remove(rolesToRemove);

      await message.reply(
        `Revoked premium from ${member.user.tag}\n`);
    } catch (error) {
      console.error(error);
      await message.reply('Failed to revoke premium. Check permissions and user ID.');
    }
  },
};

export default command;
