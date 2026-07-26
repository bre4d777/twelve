import dotenv from 'dotenv';

dotenv.config();

export interface TicketCategory {
  name: string;
  prefix: string;
}

interface Config {
  token: string;
  prefix: string;
  guildId: string;
  ownerRoleId: string;
  noPrefixUserId: string | null;
  premiumWebhookUrl: string | null;
  premiumWebhookSecret: string | null;
  premiumRoles: {
    lite: string | null;
    basic: string | null;
    premium: string | null;
  };
  premiumLogChannels: {
    grant: string | null;
    revoke: string | null;
  };
  premiumBackupChannel: string | null;
  tickets: {
    categoryId: string;
    categories: TicketCategory[];
  };
}

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

export const config: Config = {
  token: getEnvVar('TOKEN'),
  prefix: '.',
  guildId: '1278004786725261435',
  ownerRoleId: '1278030685679911076',
  noPrefixUserId: '931059762173464597',
  premiumWebhookUrl: process.env.WEBHOOK || null,
  premiumWebhookSecret: process.env.SECRET || null,
  premiumRoles: {
    lite: '1530159899399688313',
    basic: '1530159297726775316',
    premium: '1530159501297324142',
  },
  premiumLogChannels: {
    grant: '1298327726939443312',
    revoke: '1530218547488362526',
  },
  premiumBackupChannel: '1530218781450702961',
  tickets: {
    categoryId: '1530852988049166346',
    categories: [
      {
        name: 'Bug Report',
        prefix: 'bug',
      },
      {
        name: 'Feedback/Suggestion',
        prefix: 'feedback',
      },
      {
        name: 'Buy Premium',
        prefix: 'premium',
      },
      {
        name: 'General Query',
        prefix: 'general',
      },
    ],
  },
};
