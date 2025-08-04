import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { UpdateUI } from './components.js';
import { UpdateArgsSchema } from './types.js';

export const updateCommand = new Command('update')
  .description('Update Buster CLI to the latest version')
  .option('--check', 'Check for updates without installing')
  .option('--force', 'Force update even if already on latest version')
  .action(async (options) => {
    // Validate arguments
    const args = UpdateArgsSchema.parse(options);
    
    // Render Ink UI
    const { waitUntilExit } = render(<UpdateUI args={args} />);
    
    await waitUntilExit();
  });