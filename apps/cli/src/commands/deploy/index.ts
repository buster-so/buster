import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { DeployUI } from './components.js';
import { DeployArgsSchema } from './types.js';

export const deployCommand = new Command('deploy')
  .description('Deploy models to Buster')
  .option('-d, --dry-run', 'Perform a dry run without deploying')
  .option('-p, --path <path>', 'Path to models directory', './buster')
  .action(async (options) => {
    // Validate arguments
    const args = DeployArgsSchema.parse(options);
    
    // Render Ink UI
    const { waitUntilExit } = render(<DeployUI args={args} />);
    
    await waitUntilExit();
  });