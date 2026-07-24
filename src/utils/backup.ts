import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { AttachmentBuilder, TextChannel, Client } from 'discord.js';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function sendDatabaseBackup(client: Client): Promise<void> {
  if (!config.premiumBackupChannel) return;

  try {
    const dbPath = join(__dirname, '../../data/db.json');
    const dbContent = readFileSync(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);

    const channel = await client.channels.fetch(config.premiumBackupChannel) as TextChannel;

    const attachment = new AttachmentBuilder(Buffer.from(dbContent, 'utf-8'), {
      name: `premium-backup-${Date.now()}.json`,
    });

    const premiumCount = db.premiumGrants?.length || 0;

    await channel.send({
      content: `**Premium Database Backup**\nTotal grants: ${premiumCount}\nTimestamp: <t:${Math.floor(Date.now() / 1000)}:F>`,
      files: [attachment],
    });
  } catch (error) {
    console.error('Failed to send database backup:', error);
  }
}
