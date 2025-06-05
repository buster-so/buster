import * as fs from 'node:fs';
import { chromium, type FullConfig } from '@playwright/test';
import { applyAuth, authFile, hasValidAuth, login } from './auth-utils';

async function globalSetup(config: FullConfig) {
  console.log('Starting global setup');
  try {
    // Make sure auth file exists with at least empty valid JSON to prevent errors
    if (!fs.existsSync(authFile)) {
      try {
        fs.writeFileSync(
          authFile,
          JSON.stringify({
            cookies: [],
            localStorage: '{}',
            sessionStorage: '{}'
          })
        );
      } catch (error) {
        console.error('Failed to create initial auth file:', error);
        throw new Error(`Error during global setup: Failed to create auth file - ${error}`);
      }
    }

    // Use chromium browser for the setup
    const browser = await chromium
      .launch({
        headless: true,
        // Force headless mode by disabling any GUI-related options
        args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage']
      })
      .catch((error) => {
        throw new Error(`Error during global setup: Failed to launch browser - ${error}`);
      });

    const page = await browser.newPage().catch((error) => {
      browser.close().catch(() => {});
      throw new Error(`Error during global setup: Failed to create page - ${error}`);
    });

    const hasValidAuthJSON = hasValidAuth();

    try {
      // Check if we have valid stored credentials
      if (hasValidAuthJSON) {
        const authSuccess = await applyAuth(page);

        if (authSuccess) {
          // Verify login was successful by visiting a protected page
          await page.goto('http://localhost:3000/app/home').catch((error) => {
            throw new Error(
              `Error during global setup: Failed to navigate to home page - ${error}`
            );
          });

          // If we're still on the login page, we need to login again
          if (page.url().includes('/auth/login')) {
            await login(page).catch((error) => {
              throw new Error(`Error during global setup: Failed to login - ${error}`);
            });
          }
        } else {
          await login(page).catch((error) => {
            throw new Error(`Error during global setup: Failed to login - ${error}`);
          });
        }
      } else {
        await login(page).catch((error) => {
          throw new Error(
            `Error during global setup: Failed to login with no valid auth - ${error}`
          );
        });
      }

      await browser.close().catch((error) => {
        console.error(`Error closing browser: ${error}`);
        // Don't throw here, as the setup was successful
      });
    } catch (error) {
      await browser.close().catch(() => {});
      throw error; // Re-throw to stop test execution
    }
  } catch (error) {
    console.error('\x1b[31m', '🛑 GLOBAL SETUP FAILED - STOPPING TESTS', '\x1b[0m');
    console.error(error);
    // Exit process with error code to ensure test runner stops
    process.exit(1);
  }
}

export default globalSetup;
