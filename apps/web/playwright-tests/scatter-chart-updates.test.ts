import { expect, test } from '@playwright/test';

test.describe
  .serial('Create a scatter plot with a question', () => {
    const question = `I want to understand if there's a relationship between how much an employee sells and the number of orders they process. Can you generate a scatter plot showing each employee's total sales amount on one axis and their total number of orders on the other axis for the last 12 months?`;
    let scatterURL = '';
    test.skip(`I can create a scatter plot with a question: ${question}`, async ({ page }) => {
      await page.goto('http://localhost:3000/app/home');
      await page.getByRole('textbox', { name: 'Ask Buster a question...' }).click();
      await page.getByRole('textbox', { name: 'Ask Buster a question...' }).fill(question);
      await page.getByRole('main').getByRole('button').click();
      await page.waitForTimeout(4000);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByRole('link', { name: 'Reasoning link' })).toBeVisible();

      await expect(page.getByTestId('metric-view-chart-content').getByRole('img')).toBeVisible({
        timeout: 240000 // 4 minutes
      });
      await expect(page.getByTestId('share-button')).toBeVisible();
      await expect(page.getByTestId('save-to-dashboard-button')).toBeVisible();
      await expect(page.getByTestId('edit-chart-button').getByRole('button')).toBeVisible();

      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await expect(page.getByTestId('select-chart-type-scatter')).toBeVisible();
      await expect(page.getByTestId('select-chart-type-scatter')).toHaveAttribute(
        'data-state',
        'selected'
      );

      const url = page.url();

      scatterURL = url;
    });

    // scatterURL =
    //   'http://localhost:3000/app/chats/84c1d148-4056-4aca-8741-29f2d11619c2/metrics/8c1e2db2-1cbb-532a-bf36-040c2431c7f3/chart?metric_version_number=1&secondary_view=chart-edit';

    test.skip('I can update the scatter plot', async ({ page }) => {
      await page.goto(scatterURL);
      await expect(page.getByTestId('edit-chart-button').getByRole('button')).toBeVisible();
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await page.waitForTimeout(250);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('select-chart-type-scatter')).not.toBeVisible();
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await page.waitForTimeout(250);
      await expect(page.getByTestId('select-chart-type-scatter')).toHaveAttribute(
        'data-state',
        'selected'
      );
      await page.getByTestId('segmented-trigger-Styling').click();
      await expect(page.getByText('Dot size')).toBeVisible();
    });

    // scatterURL =
    //   'http://localhost:3000/app/metrics/8c1e2db2-1cbb-532a-bf36-040c2431c7f3/chart?secondary_view=chart-edit';

    test.skip('I can add a trend line', async ({ page }) => {
      await page.goto(scatterURL);
      await page.waitForTimeout(100);
      await page.getByTestId('segmented-trigger-Styling').click();
      await page.getByRole('button', { name: 'Add trend line' }).click();

      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Linear$/ })
          .nth(1)
      ).toBeVisible();

      await page.locator('.relative > button').first().click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Linear$/ })
          .nth(1)
      ).toBeHidden();
    });
  });
