import { createBusterSDK } from '@buster/sdk';
import { Command } from 'commander';
import { render } from 'ink';
import { saveCredentials } from '../../utils/credentials';
import { Auth } from './auth';

/**
 * Creates the auth command for authentication management
 */
export function createAuthCommand(): Command {
  return new Command('auth')
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
          console.error(
            '❌ Authentication failed:',
            error instanceof Error ? error.message : 'Unknown error'
          );
          process.exit(1);
        }
      }

      // For interactive environments, use the Ink UI
      render(<Auth {...options} />);
    });
}
