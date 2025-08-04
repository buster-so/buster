import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { StopUI } from './components.js';

export const stopCommand = new Command('stop')
  .description('Stop Buster services')
  .action(async () => {
    // Render Ink UI
    const { waitUntilExit } = render(<StopUI />);
    
    await waitUntilExit();
  });