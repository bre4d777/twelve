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
    const premiumDbPath = join(__dirname, '../../data/premium.json');
    
    const dbContent = readFileSync(dbPath, 'utf-8');
    const premiumDbContent = readFileSync(premiumDbPath, 'utf-8');
    
    const premiumDb = JSON.parse(premiumDbContent);
    const premiumCount = premiumDb.premiumGrants?.length || 0;

    const channel = await client.channels.fetch(config.premiumBackupChannel) as TextChannel;

    const dbAttachment = new AttachmentBuilder(Buffer.from(dbContent, 'utf-8'), {
      name: `db-backup-${Date.now()}.json`,
    });

    const premiumAttachment = new AttachmentBuilder(Buffer.from(premiumDbContent, 'utf-8'), {
      name: `premium-backup-${Date.now()}.json`,
    });

    await channel.send({
      content: `Database Backup\nTotal premium grants: ${premiumCount}\nTimestamp: <t:${Math.floor(Date.now() / 1000)}:F>`,
      files: [dbAttachment, premiumAttachment],
    });
  } catch (error) {
    console.error('Failed to send database backup:', error);
  }
}
