import { Command } from 'commander';
import { render } from 'ink';
import { InitCommand } from './init';

/**
 * Creates the init command for initializing a new Buster project
 */
export function createInitCommand(): Command {
  return new Command('init')
    .description('Initialize a new Buster project')
    .option('--api-key <key>', 'Your Buster API key')
    .option('--host <url>', 'Custom API host URL')
    .option('--local', 'Use local development server')
    .option('--path <path>', 'Project location (defaults to current directory)')
    .action(async (options) => {
      render(<InitCommand {...options} />);
    });
}
