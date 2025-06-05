import { expect, test } from '@playwright/test';

test.describe
  .serial('Sharing metric', () => {
    test('Can share a metric', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/chats/865352e8-c327-461d-ae67-9efeb530ff0e/metrics/1e91b291-8883-5451-8b98-89e99071e4f8/chart?metric_version_number=1'
      );
      await page.getByTestId('share-button').click();
      await page.getByRole('textbox', { name: 'Invite others by email...' }).click();
      await page
        .getByRole('textbox', { name: 'Invite others by email...' })
        .fill('blake@buster.so');
      await page.getByRole('button', { name: 'Invite' }).click();
      await page.waitForTimeout(100);
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Can view')).toBeVisible();
      await page.getByText('Can view').click();
      await page.getByRole('menuitemcheckbox', { name: 'Remove' }).click();
      await expect(page.getByText('Can view')).toBeHidden();
      await page.waitForTimeout(100);
      await page.waitForLoadState('networkidle');
    });

    test('Can publish a metric', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/chats/865352e8-c327-461d-ae67-9efeb530ff0e/metrics/1e91b291-8883-5451-8b98-89e99071e4f8/chart?metric_version_number=1'
      );
      await page.getByTestId('share-button').click();
      await page.getByTestId('segmented-trigger-Publish').click();
      await expect(page.getByRole('button', { name: 'Create public link' })).toBeVisible();
      await page.getByRole('button', { name: 'Create public link' }).click();
      await expect(page.getByText('Live on the web')).toBeVisible();
      await page.waitForTimeout(50);
      await page.waitForLoadState('networkidle');

      await page.reload();

      await page.getByTestId('share-button').click();
      await page.getByTestId('segmented-trigger-Publish').click();
      await page.getByRole('button', { name: 'Unpublish' }).click();
      await page.waitForTimeout(50);
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('button', { name: 'Create public link' })).toBeVisible();
    });
  });
