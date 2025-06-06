import { expect, test } from '@playwright/test';

test.describe
  .serial('Metric chart updates', () => {
    test('Metric can change to be a table', async ({ page }) => {
      await page.goto('http://localhost:3000/app/home');
      await page.getByRole('link', { name: 'Metrics', exact: true }).click();
      await page.getByRole('link', { name: 'Total Unique Products Sold' }).click();

      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      expect(page.getByTestId('metric-view-chart-content')).toBeVisible();

      expect(page.getByTestId('select-chart-type-column')).toBeVisible();
      expect(page.getByTestId('select-chart-type-column')).toBeDisabled();
      expect(page.getByTestId('select-chart-type-table')).not.toBeDisabled();

      //
      await page.getByTestId('select-chart-type-table').click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Unsaved changesResetSave$/ })
          .nth(1)
      ).toBeVisible();
      await page.getByTestId('select-chart-type-metric').click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Unsaved changesResetSave$/ })
          .nth(1)
      ).toBeHidden();
    });

    test('Metric can metric headers', async ({ page }) => {
      await page.goto('http://localhost:3000/app/home');
      await page.getByRole('link', { name: 'Metrics', exact: true }).click();
      await page.getByRole('link', { name: 'Total Unique Products Sold' }).click();
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      //

      await page.getByTestId('edit-metric-header-type').click();
      await page.getByRole('option', { name: 'Custom' }).click();
      await page.getByRole('textbox', { name: 'Enter header' }).fill('WOW!');
      await expect(page.getByRole('heading', { name: 'WOW!' })).toBeVisible();
      await page.getByRole('textbox', { name: 'Enter header' }).click();
      await page.getByRole('textbox', { name: 'Enter header' }).fill('');
      await expect(page.getByRole('heading', { name: 'WOW!' })).toBeHidden();

      //Header options
      await page.getByTestId('edit-metric-header-type').click();
      await page.getByRole('option', { name: 'Column title' }).click();
      await expect(page.getByRole('heading', { name: 'Total Unique Products Sold' })).toBeVisible();
      await page.getByTestId('edit-metric-header-type').click();
      await page.getByRole('option', { name: 'Column value' }).click();
      await expect(page.locator('h4')).toBeVisible();
      await page.getByRole('button', { name: 'Reset' }).click();

      //Subheader options

      await page.getByTestId('edit-metric-subheader-type').click();
      await page.getByRole('option', { name: 'Custom' }).click();
      await page.getByRole('textbox', { name: 'Enter sub-header' }).fill('Cool!');
      await expect(page.getByRole('heading', { name: 'Cool!' })).toBeVisible();
      await page.getByTestId('edit-metric-subheader-type').click();
      await page.getByText('Column title').click();
      await expect(page.getByRole('heading', { name: 'Total Unique Products Sold' })).toBeVisible();
      await page.getByTestId('edit-metric-subheader-type').click();
      await page.getByRole('option', { name: 'Column value' }).click();

      await page.waitForTimeout(1000);
      await expect(page.locator('h4')).toBeVisible();
      await page.getByRole('button', { name: 'Reset' }).click();
      await expect(page.locator('h4')).toBeHidden();
    });
  });
