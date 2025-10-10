import type { Command } from 'commander';

/**
 * Sets up pre-action hook to handle global options like --cwd
 */
export function setupPreActionHook(program: Command): void {
  program.hook('preAction', (thisCommand) => {
    // Process --cwd option before any command runs
    const opts = thisCommand.optsWithGlobals();
    if (opts.cwd) {
      process.chdir(opts.cwd);
    }
  });
}
