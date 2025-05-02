import { BusterRoutes, createBusterRoute } from '@/routes';
import { test, expect } from '@playwright/test';

const chatsRoute = createBusterRoute({
  route: BusterRoutes.APP_CHAT
});

test('Can navigate to a metric chart from the metric list', async ({ page }) => {
  await page.goto('http://localhost:3000/app/home');
  await page.getByRole('link', { name: 'Metrics' }).click();
  await expect(page.getByText('Chat history')).toBeVisible();

  await page.locator('.list-container').getByRole('link').first().click();

  await page.waitForURL((url) => url.toString() !== chatsRoute);
  expect(page.url()).not.toEqual(chatsRoute);
});
