import chalk from 'chalk';
import { getCurrentVersion } from '../commands/update/update-handler';
import { checkForUpdate, formatVersion } from '../utils/version/index';

/**
 * Sets up background update checking for the CLI
 * Runs non-blocking and shows notification if update is available
 */
export function setupUpdateChecker(): void {
  // Skip in CI or if explicitly disabled
  if (process.env.CI || process.env.BUSTER_NO_UPDATE_CHECK) {
    return;
  }

  const currentVersion = getCurrentVersion();

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
              chalk.dim(`${formatVersion(currentVersion)} → ${formatVersion(result.latestVersion)}`) +
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
