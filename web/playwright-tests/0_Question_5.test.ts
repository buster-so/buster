import { test, expect } from '@playwright/test';
import { askQuestion } from './question-helpers/ask-question';

const question = 'What can I ask about?';

test.skip(`Question: ${question}`, async ({ page }) => {
  await askQuestion(page, question);

  //wait for 2 seconds
  await page.waitForTimeout(2000);

  //expect to for the text "Reasoned" on the page
  await expect(page.getByText('Reasoned')).toBeVisible({ timeout: 30000 });

  expect(page.url()).not.toContain('metric');
  expect(page.url()).not.toContain('dashboard');
});
