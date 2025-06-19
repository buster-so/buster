import { expect, test } from '@playwright/test';

test.skip('Can add dashboard to collection', async ({ page }) => {
  await page.goto('http://localhost:3000/app/dashboards/c0855f0f-f50a-424e-9e72-9e53711a7f6a/file');

  await page.getByTestId('add-to-collection-button').click();
  await expect(page.getByRole('checkbox')).toHaveAttribute('data-state', 'checked');

  await page.getByRole('checkbox').click();
  await expect(page.getByRole('checkbox')).toHaveAttribute('data-state', 'unchecked');
  await page
    .getByRole('menuitemcheckbox', { name: 'Important Things' })
    .getByRole('button')
    .click();

  const url = 'http://localhost:3000/app/collections/0ac43ae2-beda-4007-9574-71a17425da0a';
  await page.waitForTimeout(1000);
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.url()).toBe(url);

  // Verify that "Important Metrics" text is not on the page
  await expect(page.locator('.list-container').getByText('Important Metrics')).not.toBeVisible();

  await page.goBack();
  await page.getByTestId('add-to-collection-button').click();
  await expect(page.getByRole('checkbox')).toHaveAttribute('data-state', 'unchecked');
  await page
    .getByRole('menuitemcheckbox', { name: 'Important Things' })
    .getByRole('button')
    .click();
  await page.waitForTimeout(100);
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
  await page.goto('http://localhost:3000/app/dashboards/c0855f0f-f50a-424e-9e72-9e53711a7f6a/file');
});
