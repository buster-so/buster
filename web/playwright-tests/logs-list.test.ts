import { test, expect } from '@playwright/test';

test('Can navigate to a metric chart from the metric list', async ({ page }) => {
  await page.goto('http://localhost:3000/app/home');
  await page.getByRole('link', { name: 'Logs' }).click();
  await expect(
    page
      .locator('div')
      .filter({ hasText: /^Today6$/ })
      .nth(2)
  ).toBeVisible();
  await page.locator('[data-testid="metric-list-container"]').getByRole('link').first().click();

  await page.waitForURL((url) => url.toString().includes('chart'));
  expect(page.url()).toContain('chart');
});
