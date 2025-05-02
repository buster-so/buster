import { BusterRoutes, createBusterRoute } from '@/routes';
import { test, expect } from '@playwright/test';

const logsRoute = createBusterRoute({
  route: BusterRoutes.APP_LOGS
});

test('Can navigate to a metric chart from the metric list', async ({ page }) => {
  await page.goto('http://localhost:3000/app/home');
  await page.getByRole('link', { name: 'Logs' }).click();
  await expect(page.getByText('Name')).toBeVisible();

  await page.locator('.list-container').getByRole('link').first().click();

  await page.waitForURL((url) => url.toString() !== logsRoute);
  expect(page.url()).not.toEqual(logsRoute);
});
