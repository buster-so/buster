import { Command } from 'commander';
import { render } from 'ink';
import { DeployCommand } from './deploy';
import { deployHandler } from './deploy-handler.js';
import { DeployOptionsSchema } from './schemas';
import { formatDeployError, getExitCode, isDeploymentValidationError } from './utils/errors.js';

/**
 * Creates the deploy command for deploying semantic models
 */
export function createDeployCommand(): Command {
  return new Command('deploy')
    .description('Deploy semantic models to Buster API')
    .option(
      '--path <path>',
      'Path to search for buster.yml and model files (defaults to current directory)'
    )
    .option('--dry-run', 'Validate models without deploying')
    .option('--verbose', 'Show detailed output')
    .option('--debug', 'Enable debug mode with detailed SQL logging')
    .option('--interactive', 'Use interactive UI mode')
    .action(async (options) => {
      try {
        // Parse and validate options
        const parsedOptions = DeployOptionsSchema.parse({
          path: options.path,
          dryRun: options.dryRun || false,
          verbose: options.verbose || false,
          debug: options.debug || false,
        });

        // Use interactive UI mode only if explicitly requested
        if (options.interactive) {
          render(<DeployCommand {...parsedOptions} />);
        } else {
          // Direct execution for cleaner CLI output
          await deployHandler(parsedOptions);
        }
      } catch (error) {
        // Check if it's a DeploymentValidationError to handle it specially
        if (isDeploymentValidationError(error)) {
          // The error message already contains the formatted output
          console.error(formatDeployError(error));
          process.exit(getExitCode(error));
        } else {
          // For other errors, still show them but formatted properly
          console.error(formatDeployError(error));
          process.exit(getExitCode(error));
        }
      }
    });
}
