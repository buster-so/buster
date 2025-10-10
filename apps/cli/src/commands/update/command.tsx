import { Command } from 'commander';
import { render } from 'ink';
import { UpdateCommand } from './update';

/**
 * Creates the update command for updating the CLI to the latest version
 */
export function createUpdateCommand(): Command {
  return new Command('update')
    .description('Update Buster CLI to the latest version')
    .option('--check', 'Check for updates without installing')
    .option('--force', 'Force update even if on latest version')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (options) => {
      render(<UpdateCommand {...options} />);
    });
}
