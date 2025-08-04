import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { StartUI } from './components.js';
import { StartArgsSchema } from './types.js';

export const startCommand = new Command('start')
  .description('Start Buster services')
  .option('-d, --detached', 'Run services in detached mode')
  .option('--no-telemetry', 'Disable telemetry')
  .action(async (options) => {
    // Validate arguments
    const args = StartArgsSchema.parse(options);
    
    // Render Ink UI
    const { waitUntilExit } = render(<StartUI args={args} />);
    
    await waitUntilExit();
  });