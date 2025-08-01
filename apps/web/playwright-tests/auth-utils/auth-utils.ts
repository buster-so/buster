import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { jwtDecode } from 'jwt-decode';
import isEmpty from 'lodash/isEmpty';

// Path to the authentication state file
export const authFile = path.join(__dirname, 'auth.json');

/**
 * Checks if valid authentication data exists
 */
export function hasValidAuth(): boolean {
  try {
    if (!fs.existsSync(authFile)) {
      return false;
    }

    const authData = JSON.parse(fs.readFileSync(authFile, 'utf-8'));

    if (
      isEmpty(authData) ||
      isEmpty(authData.cookies) ||
      isEmpty(authData.localStorage) ||
      isEmpty(authData.sessionStorage)
    ) {
      return false;
    }

    // Check if JWT is valid
    if (authData.localStorage) {
      const storage = JSON.parse(authData.localStorage);
      const token = storage.buster_token || storage.token;

      if (token) {
        try {
          const decoded = jwtDecode(token);
          const expTime = decoded.exp ? decoded.exp * 1000 : 0; // Convert to milliseconds

          if (expTime && expTime < Date.now()) {
            return false;
          }
        } catch (error) {
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Performs login and saves authentication state
 */
export async function login(page: Page) {
  await page.goto('http://localhost:3000/auth/login');

  // Add your login logic here, for example:

  await page.getByText('Sign in').click();
  await page.getByText(`Don't already have an account?`).click();
  await page.getByRole('textbox', { name: 'What is your email address?' }).fill('chad@buster.so');
  await page.getByRole('textbox', { name: 'What is your email address?' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('password');
  expect(page.getByRole('textbox', { name: 'Confirm passowrd' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Sign in' }).click();

  //expect "Invalid email or password" to not be visible
  expect(page.getByText('Invalid email or password')).not.toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(250);
  await page.waitForURL('http://localhost:3000/app/home');
  await page.waitForTimeout(250);
  await page.goto('http://localhost:3000/app/new-user');
  await page.getByRole('button', { name: 'Get Started' }).click();
  await page.getByRole('textbox', { name: 'What is your full name' }).dblclick();
  await page.getByRole('textbox', { name: 'What is your full name' }).fill('Chad');
  await page.waitForTimeout(20);
  await page.getByRole('button', { name: 'Create your account' }).click();
  await page.waitForTimeout(550);

  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');

  await page.waitForURL('http://localhost:3000/app/home');

  // Wait for the page to be fully loaded before accessing storage
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');

  // Save authentication data
  const authData = {
    cookies: await page.context().cookies(),
    localStorage: await page.evaluate(() => JSON.stringify(localStorage)),
    sessionStorage: await page.evaluate(() => JSON.stringify(sessionStorage))
  };

  try {
    fs.writeFileSync(authFile, JSON.stringify(authData));
    return authData;
  } catch (error) {
    console.error('Failed to save authentication data:', error);
    return authData;
  }
}

/**
 * Applies saved authentication state to a page
 */
export async function applyAuth(page: Page): Promise<boolean> {
  if (!hasValidAuth()) {
    return false;
  }

  try {
    const authData = JSON.parse(fs.readFileSync(authFile, 'utf-8'));

    // Add cookies
    await page.context().addCookies(authData.cookies || []);

    // Set localStorage and sessionStorage
    if (!isEmpty(authData.localStorage) || !isEmpty(authData.sessionStorage)) {
      await page.goto('http://localhost:3000');

      if (authData.localStorage) {
        await page.evaluate((storageData) => {
          const storage = JSON.parse(storageData);
          for (const [key, value] of Object.entries(storage)) {
            localStorage.setItem(key, value as string);
          }
        }, authData.localStorage);
      }

      if (authData.sessionStorage) {
        await page.evaluate((storageData) => {
          const storage = JSON.parse(storageData);
          for (const [key, value] of Object.entries(storage)) {
            sessionStorage.setItem(key, value as string);
          }
        }, authData.sessionStorage);
      }
    } else {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to apply authentication:', error);
    return false;
  }
}

/**
 * Clears saved authentication data
 */
export function clearAuth() {
  try {
    if (fs.existsSync(authFile)) {
      fs.unlinkSync(authFile);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to clear authentication data:', error);
    return false;
  }
}
