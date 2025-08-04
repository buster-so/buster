import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { ResetUI } from './components.js';
import { ResetArgsSchema } from './types.js';

export const resetCommand = new Command('reset')
  .description('Reset Buster services and data')
  .option('--hard', 'Remove all data and configurations')
  .option('--force', 'Skip confirmation prompts')
  .action(async (options) => {
    // Validate arguments
    const args = ResetArgsSchema.parse(options);
    
    // Render Ink UI
    const { waitUntilExit } = render(<ResetUI args={args} />);
    
    await waitUntilExit();
  });