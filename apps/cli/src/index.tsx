#!/usr/bin/env bun
import chalk from 'chalk';
import { program } from 'commander';
import { render } from 'ink';
import { Auth } from './commands/auth';
import { DeployCommand } from './commands/deploy/deploy';
import { DeployOptionsSchema } from './commands/deploy/schemas';
import { InitCommand } from './commands/init';
import { UpdateCommand } from './commands/update/index';
import { getCurrentVersion } from './commands/update/update-handler';
import { checkForUpdate, formatVersion } from './utils/version/index';

// Get current version
const currentVersion = getCurrentVersion();

// CLI metadata
program
  .name('buster')
  .description('Buster CLI - AI-powered data analytics platform')
  .version(currentVersion);

// Check for updates in the background (non-blocking)
if (!process.env.CI && !process.env.BUSTER_NO_UPDATE_CHECK) {
  checkForUpdate(currentVersion)
    .then((result) => {
      if (result?.updateAvailable) {
        // Show update notification after a small delay to not interfere with command output
        setTimeout(() => {
          console.info('');
          console.info(chalk.yellow('╭────────────────────────────────────────────╮'));
          console.info(
            chalk.yellow('│') +
              '  ' +
              chalk.bold('Update available!') +
              ' ' +
              chalk.dim(
                `${formatVersion(currentVersion)} → ${formatVersion(result.latestVersion)}`
              ) +
              '  ' +
              chalk.yellow('│')
          );
          console.info(
            chalk.yellow('│') +
              '  Run ' +
              chalk.cyan('buster update') +
              ' to update             ' +
              chalk.yellow('│')
          );
          console.info(chalk.yellow('╰────────────────────────────────────────────╯'));
          console.info('');
        }, 100);
      }
    })
    .catch(() => {
      // Silently ignore errors in update check
    });
}

// Auth command - authentication management
program
  .command('auth')
  .description('Authenticate with Buster API')
  .option('--api-key <key>', 'Your Buster API key')
  .option('--host <url>', 'Custom API host URL')
  .option('--local', 'Use local development server (http://localhost:3001)')
  .option('--cloud', 'Use cloud instance (https://api2.buster.so)')
  .option('--clear', 'Clear saved credentials')
  .option('--show', 'Show current credentials')
  .option('--no-save', "Don't save credentials to disk")
  .action(async (options) => {
    // Check if we're in a non-TTY environment (CI/CD)
    const isTTY = process.stdin.isTTY;
    const isCIEnvironment = process.env.CI || !isTTY;

    // In CI environments, we need to handle auth differently
    if (isCIEnvironment && !options.apiKey && !process.env.BUSTER_API_KEY) {
      console.error('❌ Non-interactive environment detected.');
      console.error(
        '   Please provide API key via --api-key flag or BUSTER_API_KEY environment variable.'
      );
      console.error('   Example: buster auth --api-key YOUR_API_KEY');
      console.error('   Or set: export BUSTER_API_KEY=YOUR_API_KEY');
      process.exit(1);
    }

    // If we have an API key in CI, just validate and save it without interactive UI
    if (isCIEnvironment && (options.apiKey || process.env.BUSTER_API_KEY)) {
      const { createBusterSDK } = await import('@buster/sdk');
      const { saveCredentials } = await import('./utils/credentials');

      const apiKey = options.apiKey || process.env.BUSTER_API_KEY;
      const host =
        options.host ||
        (options.local
          ? 'http://localhost:3001'
          : options.cloud
            ? 'https://api2.buster.so'
            : 'https://api2.buster.so');
      const normalizedHost = host.startsWith('http') ? host : `https://${host}`;

      try {
        // Validate the API key
        const sdk = createBusterSDK({
          apiKey: apiKey,
          apiUrl: normalizedHost,
          timeout: 30000,
        });

        const isValid = await sdk.auth.isApiKeyValid();

        if (isValid) {
          if (!options.noSave) {
            await saveCredentials({ apiKey, apiUrl: normalizedHost });
            console.log('✅ Authentication successful and credentials saved.');
          } else {
            console.log(
              '✅ Authentication successful (credentials not saved due to --no-save flag).'
            );
          }
          process.exit(0);
        } else {
          console.error('❌ Invalid API key.');
          process.exit(1);
        }
      } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        process.exit(1);
      }
    }

    // For interactive environments, use the Ink UI
    render(<Auth {...options} />);
  });

// Hidden commands - not shown to users but kept for development
// Hello command - basic example (hidden)
// program
//   .command('hello')
//   .description('Say hello')
//   .argument('[name]', 'Name to greet', 'World')
//   .option('-u, --uppercase', 'Output in uppercase')
//   .action(async (name: string, options: { uppercase?: boolean }) => {
//     render(<HelloCommand name={name} uppercase={options.uppercase || false} />);
//   });

// Interactive command - demonstrates Ink's capabilities (hidden)
// program
//   .command('interactive')
//   .description('Run an interactive demo')
//   .action(async () => {
//     render(<InteractiveCommand />);
//   });

// Deploy command - deploy semantic models to Buster API
program
  .command('deploy')
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
        const { deployHandler } = await import('./commands/deploy/deploy-handler.js');
        await deployHandler(parsedOptions);
      }
    } catch (error) {
      // Import the error formatter and type guard
      const { isDeploymentValidationError, formatDeployError, getExitCode } = await import(
        './commands/deploy/utils/errors.js'
      );

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

// Init command - initialize a new Buster project
program
  .command('init')
  .description('Initialize a new Buster project')
  .option('--api-key <key>', 'Your Buster API key')
  .option('--host <url>', 'Custom API host URL')
  .option('--local', 'Use local development server')
  .option('--path <path>', 'Project location (defaults to current directory)')
  .action(async (options) => {
    render(<InitCommand {...options} />);
  });

// Update command - update the CLI to the latest version
program
  .command('update')
  .description('Update Buster CLI to the latest version')
  .option('--check', 'Check for updates without installing')
  .option('--force', 'Force update even if on latest version')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (options) => {
    render(<UpdateCommand {...options} />);
  });

// Parse command line arguments
program.parse(process.argv);
