import { chromium, FullConfig } from '@playwright/test';
import { applyAuth, login, authFile, hasValidAuth } from './auth-utils';
import * as fs from 'fs';

async function globalSetup(config: FullConfig) {
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
      // Continue - we'll handle login below
    }
  }

  // Use chromium browser for the setup
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Check if we have valid stored credentials
  if (hasValidAuth()) {
    const authSuccess = await applyAuth(page);

    if (authSuccess) {
      // Verify login was successful by visiting a protected page
      await page.goto('http://localhost:3000/app/home');

      // If we're still on the login page, we need to login again
      if (page.url().includes('/auth/login')) {
        await login(page);
      }
    } else {
      await login(page);
    }
  } else {
    await login(page);
  }

  await browser.close();
}

export default globalSetup;
