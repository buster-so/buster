import { test, expect } from '@playwright/test';

test('Can navigate to a metric chart from the metric list', async ({ page }) => {
  await page.goto('http://localhost:3000/app/home');
  await page.getByRole('link', { name: 'Metrics' }).click();
  await expect(page.getByText('Last updated')).toBeVisible();

  await page.locator('.list-container').getByRole('link').first().click();

  await page.waitForURL((url) => url.toString().includes('chart'));
  expect(page.url()).toContain('chart');
});
