import { expect, test } from '@playwright/test';
import { askQuestion, checkThatPageWasRedirected } from './question-helpers/ask-question';

test.skip('Question: Can you make me a line chart that showcases my sales over time? The time frame should be 18 months. You should just create 1 file. The sales should be deliminated in USD.  The line should also be kind of smooth so I do not see a sharp turn at every month. Also the time should be broken down by month.', async ({
  page
}) => {
  await askQuestion(
    page,
    'Can you make me a line chart that showcases my sales over time? The time frame should be 18 months. You should just create 1 file. The sales should be deliminated in USD.  The line should also be kind of smooth so I do not see a sharp turn at every month. Also the time should be broken down by month.'
  );

  await checkThatPageWasRedirected(page, ['reasoning', 'chart']);

  //expect to for the text "Reasoned" on the page
  await expect(page.getByText('Reasoned')).toBeVisible();

  //expect to for the text "Chart" on the page
  await expect(page.getByRole('tab', { name: 'Chart' })).toBeVisible();
});
