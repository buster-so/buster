import { test, expect } from '@playwright/test';

test('Can share a metric', async ({ page }) => {
  await page.goto('http://localhost:3000/app/chats');
  await page.getByRole('link', { name: 'Revenue Report: Previous Four' }).click();

  await page.getByTestId('share-button').click();
  await page.getByRole('textbox', { name: 'Invite others by email...' }).click();
  await page.getByRole('textbox', { name: 'Invite others by email...' }).fill('blake@buster.so');
  await page.getByRole('button', { name: 'Invite' }).click();
  await page.waitForTimeout(100);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Can view')).toBeVisible();
  await page.getByText('Can view').click();
  await page.getByRole('menuitemcheckbox', { name: 'Remove' }).click();
  await expect(page.getByText('Can view')).toBeHidden();
});

test('Can publish a metric', async ({ page }) => {
  await page.goto('http://localhost:3000/app/chats');
  await page.getByRole('link', { name: 'Revenue Report: Previous Four' }).click();
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
});
