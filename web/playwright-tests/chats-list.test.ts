import { BusterRoutes, createBusterRoute } from '@/routes';
import { expect, test } from '@playwright/test';

const chatsRoute = createBusterRoute({
  route: BusterRoutes.APP_CHAT
});

test.describe
  .serial('Chats list', () => {
    test('Can navigate to a chat from the chat history list', async ({ page }) => {
      await page.goto('http://localhost:3000/app/home');
      await page.getByRole('link', { name: 'Chat history' }).click();
      await expect(page.getByText('Chat history')).toBeVisible();

      await page.locator('.list-container').getByRole('link').first().click();

      await page.waitForURL((url) => url.toString() !== chatsRoute);
      expect(page.url()).not.toEqual(chatsRoute);
    });

    test('Complex click through for a chat', async ({ page }) => {
      await page.goto('http://localhost:3000/app/chats');
      await page.getByRole('link', { name: 'Total Products Sold To Date' }).click();
      await expect(page.getByTestId('chat-response-message-file')).toBeVisible();
      await page.getByRole('link', { name: 'Chat history' }).click();
      await page.getByRole('link', { name: 'Top Customer Identification' }).click();
      await page.goto('http://localhost:3000/app/chats/0ba71c06-f86d-4a2d-973c-3870e8a5372e');
      await page.getByRole('textbox', { name: 'Ask Buster a question...' }).click();
      await page.getByRole('link', { name: 'Chat history' }).click();
      await page.getByRole('link', { name: 'Most Active Vendor Last 3' }).click();
      await expect(page.getByTestId('metric-view-chart-content').getByRole('img')).toBeVisible();
      await page.getByTestId('collapse-file-button').click();
      await expect(page.getByTestId('metric-view-chart-content').getByRole('img')).not.toBeVisible({
        timeout: 1000
      });
      await page.getByTestId('chat-response-message-file').click();
      await expect(page.getByTestId('metric-view-chart-content').getByRole('img')).toBeVisible();
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await expect(page.getByTestId('metric-view-chart-content').getByRole('img')).toBeVisible();
      await expect(page.getByText('Edit chart')).toBeVisible();
      await page
        .locator('div')
        .filter({ hasText: /^Edit chart$/ })
        .getByRole('button')
        .click();
      await expect(page.getByTestId('chat-response-message-file')).toBeVisible();
      await expect(page.getByText('Edit chart')).not.toBeVisible();
    });
  });
