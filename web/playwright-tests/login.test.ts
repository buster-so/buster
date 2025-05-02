import { test, expect } from '@playwright/test';

test('Login to buster', async ({ page }) => {
  //await page.getByText('Sign in').click();
  await page.goto('http://localhost:3000/auth/login');
  await page.getByText('Sign in').click();
  await page.getByRole('textbox', { name: 'What is your email address?' }).fill('chad@buster.so');
  await page.getByRole('textbox', { name: 'What is your email address?' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.waitForTimeout(1500);

  await page.goto('http://localhost:3000/app/home');
  expect(page).toHaveURL('http://localhost:3000/app/home');
});
