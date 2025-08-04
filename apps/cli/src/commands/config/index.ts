import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { ConfigUI } from './components.js';
import { ConfigArgsSchema } from './types.js';

export const configCommand = new Command('config')
  .description('Manage Buster configuration')
  .option('-s, --set <key=value>', 'Set a configuration value')
  .option('-g, --get <key>', 'Get a configuration value')
  .option('-l, --list', 'List all configuration values')
  .option('--reset', 'Reset configuration to defaults')
  .action(async (options) => {
    // Validate arguments
    const args = ConfigArgsSchema.parse(options);
    
    // Render Ink UI
    const { waitUntilExit } = render(<ConfigUI args={args} />);
    
    await waitUntilExit();
  });