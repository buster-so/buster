import { program as commander } from 'commander';
import { render } from 'ink';
import { Main } from '../commands/main/main';
import { runHeadlessAgent } from '../services';
import { enableDebugLogging } from '../utils/debug-logger';
import { getVersion } from '../version';
import { setupPreActionHook } from './hooks';

interface RootOptions {
  cwd?: string;
  prompt?: string;
  chatId?: string;
  messageId?: string;
  research?: boolean;
  contextFilePath?: string;
  debug?: boolean;
  checkRun?: string;
}

export const program = commander
  .name('buster')
  .description('Buster CLI - AI-powered data analytics platform')
  .version(getVersion())
  .option('--cwd <path>', 'Set working directory for the CLI')
  .option('--prompt <prompt>', 'Run agent in headless mode with the given prompt')
  .option('--chatId <id>', 'Continue an existing conversation (used with --prompt)')
  .option('--messageId <id>', 'Message ID for tracking (used with --prompt)')
  .option('--research', 'Run agent in research mode (read-only, no file modifications)')
  .option('--contextFilePath <path>', 'Path to context file to include as system message')
  .option('--debug', 'Enable debug logging to ~/.buster/logs/debug.log')
  .option('--check-run <id>', 'GitHub check run ID to update (only valid with --prompt)');

setupPreActionHook(program);

// Root action - runs when no subcommand is specified
program.action(async (options: RootOptions) => {
  // Enable debug logging if requested
  if (options.debug) {
    enableDebugLogging();
  }

  // Change working directory if specified
  if (options.cwd) {
    process.chdir(options.cwd);
  }

  // Validate --check-run is only used with --prompt
  if (options.checkRun && !options.prompt) {
    console.error('Error: --check-run can only be used with --prompt (headless mode)');
    process.exit(1);
  }

  // Check if running in headless mode
  if (options.prompt) {
    try {
      const chatId = await runHeadlessAgent({
        prompt: options.prompt,
        workingDirectory: process.cwd(),
        ...(options.chatId && { chatId: options.chatId }),
        ...(options.messageId && { messageId: options.messageId }),
        ...(options.research && { isInResearchMode: options.research }),
        ...(options.contextFilePath && { contextFilePath: options.contextFilePath }),
        ...(options.checkRun && { checkRunId: options.checkRun }),
      });
      console.log(chatId);
      process.exit(0);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  } else {
    // Run interactive TUI mode
    render(<Main />);
  }
});
