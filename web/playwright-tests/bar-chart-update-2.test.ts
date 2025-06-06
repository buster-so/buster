import { expect, test } from '@playwright/test';

test.describe('Bar chart - parallel bar chart tests', () => {
  test('X axis config - We can edit the prefix', async ({ page }) => {
    await page.goto(
      'http://localhost:3000/app/metrics/45848c7f-0d28-52a0-914e-f3fc1b7d4180/chart?secondary_view=chart-edit'
    );
    await page
      .getByTestId('select-axis-drop-zone-category_name')
      .getByTestId('toggle-dropdown-button')
      .click();
    await page.getByRole('textbox', { name: '$' }).click();
    await page.getByRole('textbox', { name: '$' }).fill('SWAG');

    await expect(page.getByRole('textbox', { name: '$' })).toHaveValue('SWAG');

    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');
    await page.getByRole('textbox', { name: 'dollars' }).click();
    await page.getByRole('textbox', { name: 'dollars' }).fill('SWAG2');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('textbox', { name: '$' })).toHaveValue('SWAG');
    await expect(page.getByRole('textbox', { name: 'dollars' })).toHaveValue('SWAG2');

    await page.reload();

    await page
      .getByTestId('select-axis-drop-zone-xAxis')
      .getByTestId('select-axis-drop-zone-category_name')
      .getByTestId('toggle-dropdown-button')
      .click();
    await page.getByRole('textbox', { name: '$' }).click();
    await page.getByRole('textbox', { name: '$' }).fill('');
    await page.getByRole('textbox', { name: 'dollars' }).click();
    await page.getByRole('textbox', { name: 'dollars' }).fill('');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');
  });
});
