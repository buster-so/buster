import { test, expect } from '@playwright/test';

test('Can click close icon in edit chart mode', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
  await page
    .locator('div')
    .filter({ hasText: /^Edit chart$/ })
    .getByRole('button')
    .click();
  expect(page.url()).toBe(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart'
  );
  await expect(page.locator('div').filter({ hasText: /^Edit chart$/ })).not.toBeVisible();

  await page.getByTestId('edit-chart-button').getByRole('button').click();
  await expect(page.locator('div').filter({ hasText: /^Edit chart$/ })).toBeVisible();
});

test('Can click start chat', async ({ page }) => {
  await page.goto('http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart');
  await page.getByRole('button', { name: 'Start chat' }).click();
  await page.waitForTimeout(100);
  await page.waitForLoadState('networkidle');
  await expect(
    page.getByText('Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD) has been')
  ).toBeVisible();

  await page.getByTestId('collapse-file-button').click();
  await expect(page.getByTestId('collapse-file-button')).not.toBeVisible({ timeout: 7000 });

  await page.getByTestId('chat-response-message-file').click();
  await expect(page.getByTestId('metric-view-chart-content')).toBeVisible();
  await page.getByTestId('edit-chart-button').getByRole('button').click();
  await expect(page.getByText('Edit chart')).toBeVisible();

  //CAN DELETE THE CHAT NOW
  await page
    .locator('div')
    .filter({ hasText: /^Edit chart$/ })
    .getByRole('button')
    .click();
  await page.getByTestId('chat-header-options-button').click();
  await page.getByRole('menuitem', { name: 'Delete chat' }).click();
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.waitForTimeout(500);

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  await expect(page).toHaveURL('http://localhost:3000/app/chats', { timeout: 30000 });
});

test('Can add and remove from favorites', async ({ page }) => {
  await page.goto('http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart');
  await page.getByTestId('three-dot-menu-button').click();
  await page.getByRole('menuitem', { name: 'Add to favorites' }).click();
  await page.waitForTimeout(1000);
  await expect(page.getByRole('link', { name: 'Yearly Sales Revenue -' })).toBeVisible();
  await page.getByTestId('three-dot-menu-button').click();
  await page.getByRole('menuitem', { name: 'Remove from favorites' }).click();
  await expect(page.getByRole('link', { name: 'Yearly Sales Revenue -' })).toBeHidden();
});

test('Can open sql editor', async ({ page }) => {
  await page.goto('http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart');
  await page.getByTestId('edit-sql-button').getByRole('button').click();
  await expect(page.getByRole('button', { name: 'Run' })).toBeVisible();
  await page.getByTestId('edit-sql-button').getByRole('button').click();
  await page.waitForTimeout(250);

  await page.getByTestId('edit-chart-button').getByRole('button').click();
  await expect(page.locator('div').filter({ hasText: /^Edit chart$/ })).toBeVisible();
});
