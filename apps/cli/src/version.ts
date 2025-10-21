import packageJson from '../package.json';

export const VERSION = packageJson.version;

/**
 * Get the current CLI version from package.json
 */
export function getVersion(): string {
  return VERSION;
}
