import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { AuthUI } from './components.js';
import { AuthArgsSchema } from './types.js';

export const authCommand = new Command('auth')
  .description('Authenticate with Buster')
  .option('-h, --host <host>', 'API host URL')
  .option('-k, --api-key <key>', 'API key')
  .option('-e, --environment <env>', 'Environment (local/cloud)', 'cloud')
  .action(async (options) => {
    // Validate arguments
    const args = AuthArgsSchema.parse(options);
    
    // Render Ink UI
    const { waitUntilExit } = render(<AuthUI args={args} />);
    
    await waitUntilExit();
  });