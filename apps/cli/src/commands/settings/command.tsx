import { Command } from 'commander';
import { render } from 'ink';
import { SettingsCommand } from './settings';

/**
 * Creates the settings command for managing CLI settings
 */
export function createSettingsCommand(): Command {
  return new Command('settings')
    .description('Manage CLI settings')
    .option('--vim-mode <enabled>', 'Enable or disable vim keybindings (true/false)')
    .option('--toggle <setting>', 'Toggle vim mode')
    .option('--show', 'Show current settings')
    .action(async (options) => {
      // Parse vim-mode option if provided
      let vimMode: boolean | undefined;
      if (options.vimMode !== undefined) {
        vimMode = options.vimMode === 'true' || options.vimMode === '1' || options.vimMode === 'on';
      }
      render(
        <SettingsCommand
          toggle={options.toggle}
          show={options.show}
          {...(vimMode !== undefined ? { vimMode } : {})}
        />
      );
    });
}
