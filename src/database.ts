import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PremiumTier {
  id: string;
  name: string;
  price: number;
  serverActivations: number;
  durationDays: number;
}

export const PREMIUM_TIERS: Record<string, PremiumTier> = {
  LITE: {
    id: 'lite',
    name: 'Lite',
    price: 1,
    serverActivations: 0,
    durationDays: 30,
  },
  BASIC: {
    id: 'basic',
    name: 'Standard',
    price: 2,
    serverActivations: 1,
    durationDays: 30,
  },
  PREMIUM: {
    id: 'premium',
    name: 'Ultra',
    price: 2.5,
    serverActivations: 2,
    durationDays: 30,
  },
};

interface PremiumGrant {
  userId: string;
  tier: string;
  grantedAt: number;
}

interface Ticket {
  channelId: string;
  userId: string;
  category: string;
  createdAt: number;
}

interface Database {
  honeypotChannel: string | null;
  tickets: Ticket[];
}

interface PremiumDatabase {
  premiumGrants: PremiumGrant[];
}

const dbPath = join(__dirname, '../data/db.json');
const premiumDbPath = join(__dirname, '../data/premium.json');

function ensureDbExists(): void {
  if (!existsSync(join(__dirname, '../data'))) {
    mkdirSync(join(__dirname, '../data'), { recursive: true });
  }
  
  if (!existsSync(dbPath)) {
    const defaultDb: Database = {
      honeypotChannel: null,
      tickets: [],
    };
    writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
  }

  if (!existsSync(premiumDbPath)) {
    const defaultPremiumDb: PremiumDatabase = {
      premiumGrants: [],
    };
    writeFileSync(premiumDbPath, JSON.stringify(defaultPremiumDb, null, 2));
  }
}

export function readDb(): Database {
  ensureDbExists();
  const data = readFileSync(dbPath, 'utf-8');
  return JSON.parse(data) as Database;
}

export function writeDb(data: Database): void {
  ensureDbExists();
  writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export function readPremiumDb(): PremiumDatabase {
  ensureDbExists();
  const data = readFileSync(premiumDbPath, 'utf-8');
  return JSON.parse(data) as PremiumDatabase;
}

export function writePremiumDb(data: PremiumDatabase): void {
  ensureDbExists();
  writeFileSync(premiumDbPath, JSON.stringify(data, null, 2));
}

export function getHoneypotChannel(): string | null {
  return readDb().honeypotChannel;
}

export function setHoneypotChannel(channelId: string | null): void {
  const db = readDb();
  db.honeypotChannel = channelId;
  writeDb(db);
}

export function addPremiumGrant(userId: string, tier: string): void {
  const db = readPremiumDb();
  const existing = db.premiumGrants.find(g => g.userId === userId);
  
  if (existing) {
    existing.tier = tier;
    existing.grantedAt = Date.now();
  } else {
    db.premiumGrants.push({
      userId,
      tier,
      grantedAt: Date.now(),
    });
  }
  
  writePremiumDb(db);
}

export function removePremiumGrant(userId: string): void {
  const db = readPremiumDb();
  db.premiumGrants = db.premiumGrants.filter(g => g.userId !== userId);
  writePremiumDb(db);
}

export function getPremiumGrant(userId: string): PremiumGrant | undefined {
  const db = readPremiumDb();
  return db.premiumGrants.find(g => g.userId === userId);
}

export function addTicket(channelId: string, userId: string, category: string): void {
  const db = readDb();
  db.tickets.push({
    channelId,
    userId,
    category,
    createdAt: Date.now(),
  });
  writeDb(db);
}

export function removeTicket(channelId: string): void {
  const db = readDb();
  db.tickets = db.tickets.filter(t => t.channelId !== channelId);
  writeDb(db);
}

export function getTicket(channelId: string): Ticket | undefined {
  const db = readDb();
  return db.tickets.find(t => t.channelId === channelId);
}

export function getAllTickets(): Ticket[] {
  const db = readDb();
  return db.tickets;
}
