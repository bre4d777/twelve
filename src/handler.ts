import { Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Command } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const commands = new Collection<string, Command>();
export const ownerCommands = new Collection<string, Command>();

async function loadCommands(dir: string, collection: Collection<string, Command>): Promise<void> {
  const commandsPath = join(__dirname, dir);
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const commandModule = await import(`file://${filePath}`);
    const command: Command = commandModule.default;

    if ('name' in command && 'execute' in command) {
      collection.set(command.name, command);
      console.log(`Loaded command: ${command.name}`);
    } else {
      console.log(`Warning: ${file} is missing required properties`);
    }
  }
}

export async function loadAllCommands(): Promise<void> {
  await loadCommands('commands', commands);
  await loadCommands('commands/owner', ownerCommands);
  console.log(`Loaded ${commands.size} regular commands and ${ownerCommands.size} owner commands`);
}
