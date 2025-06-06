import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export const askQuestion = async (page: Page, question: string) => {
  await page.goto('http://localhost:3000/app/home');
  await page.getByRole('textbox', { name: 'Ask Buster a question...' }).click();
  await page.getByRole('textbox', { name: 'Ask Buster a question...' }).fill(question);
  await expect(page.getByRole('main').getByRole('button')).toBeVisible();
  await page.getByRole('textbox', { name: 'Ask Buster a question...' }).dblclick();
  await page.getByRole('textbox', { name: 'Ask Buster a question...' }).press('ControlOrMeta+a');
  await page.getByRole('textbox', { name: 'Ask Buster a question...' }).fill('');
  await expect(page.getByRole('main').getByRole('button')).toBeDisabled();
  await page.getByRole('textbox', { name: 'Ask Buster a question...' }).click();
  await page.getByRole('textbox', { name: 'Ask Buster a question...' }).fill(question);

  // Submit the question
  await page.getByRole('main').getByRole('button').click();
};

export const checkThatPageWasRedirected = async (
  page: Page,
  redirectPath: ('metrics' | 'reasoning' | 'dashboard' | 'chart')[]
) => {
  for (const path of redirectPath) {
    await page.waitForURL((url) => url.toString().includes(path), {
      timeout: 180000
    });
    expect(page.url()).toContain(path);
  }
};
