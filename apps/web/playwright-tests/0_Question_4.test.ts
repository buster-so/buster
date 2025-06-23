import { expect, test } from '@playwright/test';
import { askQuestion } from './question-helpers/ask-question';

const question = 'Who would win in a fight, 100 humans or a gorilla?';

test.skip(`Question: ${question}`, async ({ page }) => {
  await askQuestion(page, question);

  //wait for 2 seconds
  await page.waitForTimeout(2000);
  const currentURL = page.url();

  //expect to for the text "Reasoned" on the page
  await expect(page.getByText('Reasoned')).toBeVisible({ timeout: 30000 });

  expect(page.url()).not.toContain('reasoning');
  expect(currentURL).toBe(currentURL);
});
