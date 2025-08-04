import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { ParseUI } from './components.js';
import { ParseArgsSchema } from './types.js';

export const parseCommand = new Command('parse')
  .description('Parse and validate YAML model files')
  .argument('[files...]', 'Model files to parse')
  .option('-p, --path <path>', 'Path to models directory', './buster')
  .action(async (files, options) => {
    // Validate arguments
    const args = ParseArgsSchema.parse({ ...options, files });
    
    // Render Ink UI
    const { waitUntilExit } = render(<ParseUI args={args} />);
    
    await waitUntilExit();
  });