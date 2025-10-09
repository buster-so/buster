import type { Command } from 'commander';
import { createAuthCommand } from './auth/command';
import { createDeployCommand } from './deploy/command';
import { createInitCommand } from './init/command';
import { createSettingsCommand } from './settings/command';
import { createUpdateCommand } from './update';

/**
 * Registers all CLI subcommands with the program
 */
export function registerCommands(program: Command): void {
  program.addCommand(createAuthCommand());
  program.addCommand(createDeployCommand());
  program.addCommand(createInitCommand());
  program.addCommand(createSettingsCommand());
  program.addCommand(createUpdateCommand());
}
