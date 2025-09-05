#!/usr/bin/env bun
import { program } from 'commander';
import { render } from 'ink';
import React from 'react';
import { Auth } from './commands/auth.js';
import { DeployCommand } from './commands/deploy/deploy.js';
import { DeployOptionsSchema } from './commands/deploy/schemas.js';
import { InitCommand } from './commands/init.js';

// CLI metadata
program
  .name('buster')
  .description('Buster CLI - AI-powered data analytics platform')
  .version('0.1.0');

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

// Parse command line arguments
program.parse(process.argv);
