import { BusterRoutes, createBusterRoute } from '@/routes';
import { expect, test } from '@playwright/test';

const logsRoute = createBusterRoute({
  route: BusterRoutes.APP_LOGS
});

test('Can navigate to a metric chart from the logs list', async ({ page }) => {
  await page.goto('http://localhost:3000/app/home');
  await page.getByRole('link', { name: 'Logs' }).click();
  await page.waitForTimeout(1000);
  await page.waitForSelector('text=Name', { timeout: 30000 });
  await expect(page.getByText('Name', { exact: true })).toBeVisible({ timeout: 30000 });

  await page.locator('.list-container').getByRole('link').first().click();

  await page.waitForURL((url) => url.toString() !== logsRoute);
  expect(page.url()).not.toEqual(logsRoute);
});
