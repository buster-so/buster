#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Import commands
import { authCommand } from './commands/auth/index.js';
import { initCommand } from './commands/init/index.js';
import { deployCommand } from './commands/deploy/index.js';
import { parseCommand } from './commands/parse/index.js';
import { configCommand } from './commands/config/index.js';
import { updateCommand } from './commands/update/index.js';
import { startCommand } from './commands/start/index.js';
import { stopCommand } from './commands/stop/index.js';
import { resetCommand } from './commands/reset/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
);

const program = new Command();

program
  .name('buster')
  .description('Buster CLI - Your gateway to the Buster platform')
  .version(packageJson.version);

// Register commands
program.addCommand(authCommand);
program.addCommand(initCommand);
program.addCommand(deployCommand);
program.addCommand(parseCommand);
program.addCommand(configCommand);
program.addCommand(updateCommand);
program.addCommand(startCommand);
program.addCommand(stopCommand);
program.addCommand(resetCommand);

// Parse command line arguments
program.parse(process.argv);