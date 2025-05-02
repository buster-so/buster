import { test, expect } from '@playwright/test';

test('Can enter in a user name', async ({ page }) => {
  await page.goto('http://localhost:3000/app/new-user');
  await page.getByRole('button', { name: 'Get Started' }).click();
  await page.getByRole('textbox', { name: 'What is your full name' }).dblclick();
  await page.getByRole('textbox', { name: 'What is your full name' }).fill('Chad');
  await page.getByRole('button', { name: 'Create your account' }).click();
});
