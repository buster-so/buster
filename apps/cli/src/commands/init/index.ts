import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { InitUI } from './components.js';
import { InitArgsSchema } from './types.js';

export const initCommand = new Command('init')
  .description('Initialize a new Buster project')
  .option('-n, --name <name>', 'Project name')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--skip-prompts', 'Skip interactive prompts')
  .action(async (options) => {
    // Validate arguments
    const args = InitArgsSchema.parse(options);
    
    // Render Ink UI
    const { waitUntilExit } = render(<InitUI args={args} />);
    
    await waitUntilExit();
  });