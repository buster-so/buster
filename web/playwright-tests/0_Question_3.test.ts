import { test, expect } from '@playwright/test';
import { askQuestion, checkThatPageWasRedirected } from './question-helpers/ask-question';

const question =
  'I need you to make a chart for me that shows my top 8 customers in the month of May. Can you make this chart sorted by the customers name? I want to see only 1 file created.';

test.skip(`Question: ${question}`, async ({ page }) => {
  await askQuestion(page, question);

  await checkThatPageWasRedirected(page, ['reasoning', 'chart']);

  //expect to for the text "Reasoned" on the page
  await expect(page.getByText('Reasoned')).toBeVisible();

  //expect to for the text "Chart" on the page

  await expect(page.getByRole('tab', { name: 'Chart' })).toBeVisible();
});
