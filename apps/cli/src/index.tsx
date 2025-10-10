#!/usr/bin/env bun
import { program } from './buster/program';
import { setupUpdateChecker } from './buster/update-checker';
import { registerCommands } from './commands/command-registry';

// Setup background update checking
setupUpdateChecker();

// Register all subcommands
registerCommands(program);

// Parse command line arguments
program.parse(process.argv);
