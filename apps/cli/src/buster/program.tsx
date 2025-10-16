import { program as commander } from 'commander';
import { render } from 'ink';
import { Main } from '../commands/main/main';
import { getCurrentVersion } from '../commands/update/update-handler';
import { runHeadlessAgent } from '../services';
import { setupPreActionHook } from './hooks';

interface RootOptions {
  cwd?: string;
  prompt?: string;
  chatId?: string;
  messageId?: string;
  research?: boolean;
}

export const program = commander
  .name('buster')
  .description('Buster CLI - AI-powered data analytics platform')
  .version(getCurrentVersion())
  .option('--cwd <path>', 'Set working directory for the CLI')
  .option('--prompt <prompt>', 'Run agent in headless mode with the given prompt')
  .option('--chatId <id>', 'Continue an existing conversation (used with --prompt)')
  .option('--messageId <id>', 'Message ID for tracking (used with --prompt)')
  .option('--research', 'Run agent in research mode (read-only, no file modifications)');

setupPreActionHook(program);

// Root action - runs when no subcommand is specified
program.action(async (options: RootOptions) => {
  // Change working directory if specified
  if (options.cwd) {
    process.chdir(options.cwd);
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
