import { Client, GatewayIntentBits, Message, GuildMember, PartialGuildMember, TextChannel } from 'discord.js';
import { config } from './config.js';
import { commands, ownerCommands, loadAllCommands } from './handler.js';
import { getHoneypotChannel, addPremiumGrant, removePremiumGrant, getPremiumGrant, PREMIUM_TIERS } from './database.js';
import { sendPremiumWebhook } from './utils/webhook.js';
import { sendDatabaseBackup } from './utils/backup.js';

const pendingRoleCleanup = new Set<string>();

const TIER_RANK = ['lite', 'basic', 'premium'];

function tierOfRoleId(roleId: string): string | undefined {
  if (roleId === config.premiumRoles.lite) return 'lite';
  if (roleId === config.premiumRoles.basic) return 'basic';
  if (roleId === config.premiumRoles.premium) return 'premium';
  return undefined;
}

function highestTierRole<T extends { id: string }>(roles: T[]): T {
  return roles.reduce((best, role) => {
    const bestRank = TIER_RANK.indexOf(tierOfRoleId(best.id) ?? '');
    const roleRank = TIER_RANK.indexOf(tierOfRoleId(role.id) ?? '');
    return roleRank > bestRank ? role : best;
  });
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ],
});

client.once('clientReady', () => {
  console.log(`Bot is ready! Logged in as ${client.user?.tag}`);
});

client.on('messageCreate', async (message: Message) => {
  if (message.author.bot) return;
  if (message.guildId !== config.guildId) return;

  const honeypotChannel = getHoneypotChannel();
  if (honeypotChannel && message.channelId === honeypotChannel) {
    try {
      const member = message.member;
      if (!member) return;

      await member.ban({ deleteMessageSeconds: 86400, reason: 'Honeypot triggered' });
      await member.guild.members.unban(member.id, 'Honeypot soft ban');
      console.log(`Soft banned ${member.user.tag} for posting in honeypot channel`);
    } catch (error) {
      console.error('Error processing honeypot:', error);
    }
    return;
  }

  const isNoPrefixUser = config.noPrefixUserId && message.author.id === config.noPrefixUserId;
  const hasPrefix = message.content.startsWith(config.prefix);

  if (!hasPrefix && !isNoPrefixUser) return;

  let args: string[];
  let commandName: string | undefined;

  if (isNoPrefixUser && !hasPrefix) {
    args = message.content.trim().split(/ +/);
    commandName = args.shift()?.toLowerCase();
  } else {
    args = message.content.slice(config.prefix.length).trim().split(/ +/);
    commandName = args.shift()?.toLowerCase();
  }

  if (!commandName) return;

  const command = commands.get(commandName);
  const ownerCommand = ownerCommands.get(commandName);

  if (ownerCommand) {
    const member = message.member;
    if (!member) {
      await message.reply('Unable to verify permissions');
      return;
    }

    if (!member.roles.cache.has(config.ownerRoleId)) {
      await message.reply('You do not have permission to use this command');
      return;
    }

    try {
      await ownerCommand.execute(message, args);
    } catch (error) {
      console.error(error);
      await message.reply('There was an error executing that command');
    }
  } else if (command) {
    try {
      await command.execute(message, args);
    } catch (error) {
      console.error(error);
      await message.reply('There was an error executing that command');
    }
  }
});

client.on('guildMemberUpdate', async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
  if (newMember.guild.id !== config.guildId) return;

  if (pendingRoleCleanup.has(newMember.id)) {
    pendingRoleCleanup.delete(newMember.id);
    return;
  }

  const premiumRoleIds = [
    config.premiumRoles.lite,
    config.premiumRoles.basic,
    config.premiumRoles.premium,
  ].filter((id): id is string => id !== null);

  const oldPremiumRoles = oldMember.roles.cache.filter(role => premiumRoleIds.includes(role.id));
  let newPremiumRoles = newMember.roles.cache.filter(role => premiumRoleIds.includes(role.id));
  const justAddedRoles = newPremiumRoles.filter(role => !oldPremiumRoles.has(role.id));

  // Handle multiple premium roles - keep only the highest tier
  if (newPremiumRoles.size > 1) {
    const candidates = justAddedRoles.size > 0 ? justAddedRoles : newPremiumRoles;
    const keepRole = highestTierRole([...candidates.values()]);
    const toRemove = [...newPremiumRoles.filter(role => role.id !== keepRole.id).values()];

    if (toRemove.length > 0) {
      try {
        pendingRoleCleanup.add(newMember.id);
        await newMember.roles.remove(toRemove, 'Duplicate premium role cleanup - keeping highest tier');
        console.log(`Removed duplicate premium roles from ${newMember.user.tag}, kept ${keepRole.name}. Removed: ${toRemove.map(r => r.name).join(', ')}`);
      } catch (error) {
        pendingRoleCleanup.delete(newMember.id);
        console.error('Failed to clean up duplicate premium roles:', error);
        return;
      }

      newPremiumRoles = newMember.roles.cache.filter(role => role.id === keepRole.id);
    }
  }

  const addedRoles = newPremiumRoles.filter(role => !oldPremiumRoles.has(role.id));
  const removedRoles = oldPremiumRoles.filter(role => !newPremiumRoles.has(role.id));

  // Handle role additions - grant premium
  if (addedRoles.size > 0) {
    const addedRole = highestTierRole([...addedRoles.values()]);
    if (!addedRole) return;

    const tier = tierOfRoleId(addedRole.id);
    if (!tier) return;

    addPremiumGrant(newMember.id, tier);

    const webhookResult = await sendPremiumWebhook('grant', newMember.id, tier);

    await sendDatabaseBackup(client);

    console.log(`Granted ${tier} tier to ${newMember.user.tag} (${newMember.id})`);

    if (config.premiumLogChannels.grant) {
      try {
        const channel = await client.channels.fetch(config.premiumLogChannels.grant) as TextChannel;
        const tierInfo = Object.values(PREMIUM_TIERS).find(t => t.id === tier);
        await channel.send(
          `**Premium Granted**\n` +
          `User: ${newMember.user.tag} (<@${newMember.id}>) (${newMember.id})\n` +
          `Tier: ${tierInfo?.name || tier}\n` +
          `Webhook: ${webhookResult.success ? 'Success' : `${webhookResult.error}`}`
        );
      } catch (error) {
        console.error('Failed to send grant log:', error);
      }
    }
  }

  // Handle role removals - only revoke if ALL premium roles are gone
  if (removedRoles.size > 0 && newPremiumRoles.size === 0) {
    const previousGrant = getPremiumGrant(newMember.id);
    
    removePremiumGrant(newMember.id);

    const webhookResult = await sendPremiumWebhook('revoke', newMember.id);

    await sendDatabaseBackup(client);

    console.log(`Revoked premium from ${newMember.user.tag} (${newMember.id}) - all roles removed`);

    if (config.premiumLogChannels.revoke) {
      try {
        const channel = await client.channels.fetch(config.premiumLogChannels.revoke) as TextChannel;
        const tierInfo = previousGrant ? Object.values(PREMIUM_TIERS).find(t => t.id === previousGrant.tier) : null;
        await channel.send(
          `**Premium Revoked**\n` +
          `User: ${newMember.user.tag} (${newMember.id})\n` +
          `Previous Tier: ${tierInfo?.name || previousGrant?.tier || 'Unknown'}\n` +
          `Webhook: ${webhookResult.success ? 'Success' : `${webhookResult.error}`}`
        );
      } catch (error) {
        console.error('Failed to send revoke log:', error);
      }
    }
  } else if (removedRoles.size > 0 && newPremiumRoles.size > 0) {
    // Roles were removed but user still has premium roles - update tier to remaining role
    const remainingRole = highestTierRole([...newPremiumRoles.values()]);
    const tier = tierOfRoleId(remainingRole.id);
    
    if (tier) {
      const previousGrant = getPremiumGrant(newMember.id);
      addPremiumGrant(newMember.id, tier);
      console.log(`Updated ${newMember.user.tag} tier from ${previousGrant?.tier || 'unknown'} to ${tier} (removed some roles, kept ${remainingRole.name})`);
    }
  }
});

client.on('guildMemberRemove', async (member: GuildMember | PartialGuildMember) => {
  if (member.guild.id !== config.guildId) return;

  const premiumGrant = getPremiumGrant(member.id);
  if (!premiumGrant) return;

  const premiumRoleIds = [
    config.premiumRoles.lite,
    config.premiumRoles.basic,
    config.premiumRoles.premium,
  ].filter((id): id is string => id !== null);

  const hadPremiumRole = premiumRoleIds.some(roleId => member.roles.cache.has(roleId));

  if (hadPremiumRole || premiumGrant) {
    removePremiumGrant(member.id);

    const webhookResult = await sendPremiumWebhook('revoke', member.id);

    await sendDatabaseBackup(client);

    if (config.premiumLogChannels.revoke) {
      try {
        const channel = await client.channels.fetch(config.premiumLogChannels.revoke) as TextChannel;
        const tierInfo = Object.values(PREMIUM_TIERS).find(t => t.id === premiumGrant.tier);
        const userTag = member.user ? member.user.tag : 'Unknown User';
        await channel.send(
          `**Premium Auto-Revoked (User Left)**\n` +
          `User: ${userTag} (${member.id})\n` +
          `Tier: ${tierInfo?.name || premiumGrant.tier}\n` +
          `Webhook: ${webhookResult.success ? 'Success' : `${webhookResult.error}`}`
        );
      } catch (error) {
        console.error('Failed to send leave revoke log:', error);
      }
    }

    const userTag = member.user ? member.user.tag : member.id;
    console.log(`Auto-revoked premium for ${userTag} (left server)`);
  }
});

await loadAllCommands();
await client.login(config.token);
