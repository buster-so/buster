import { test, expect } from '@playwright/test';

test('Can add to collection', async ({ page }) => {
  await page.goto('http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart');
  await page.getByTestId('add-to-collection-button').click();
  await expect(page.getByRole('checkbox')).toHaveAttribute('data-state', 'unchecked');
  await page.getByRole('checkbox').click();
  await expect(page.getByRole('checkbox')).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveAttribute('data-state', 'checked');
  await page.waitForTimeout(100);
  await page.waitForLoadState('networkidle');
  await page.reload();
  await page.getByTestId('add-to-collection-button').click();
  await expect(page.getByRole('checkbox')).toHaveAttribute('data-state', 'checked');
  await page.getByRole('checkbox').click();
  await expect(page.getByRole('checkbox')).toHaveAttribute('data-state', 'unchecked');
  await page.waitForTimeout(100);
  await page.waitForLoadState('networkidle');
});

test('Can navigate to collections page', async ({ page }) => {
  await page.goto('http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart');
  await page.getByTestId('add-to-collection-button').click();
  const currentUrl = page.url();
  await page
    .getByRole('menuitemcheckbox', { name: 'Important Things' })
    .getByRole('button')
    .click();
  await page.goto('http://localhost:3000/app/collections/0ac43ae2-beda-4007-9574-71a17425da0a');
  expect(page.url()).not.toBe(currentUrl);
});

test('Add to dashboard', async ({ page }) => {
  await page.goto('http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart');
  await page.getByTestId('save-to-dashboard-button').click();
  await page.getByText('Important Metrics').click();
  await expect(
    page.getByRole('menuitemcheckbox', { name: 'Important Metrics' }).getByRole('checkbox')
  ).toBeVisible();

  await page.waitForTimeout(100);
  await page.waitForLoadState('networkidle');
  await page.reload();

  await page.getByTestId('save-to-dashboard-button').click();
  await page
    .getByRole('menuitemcheckbox', { name: 'Important Metrics' })
    .getByRole('button')
    .click();
  await expect(page.getByRole('button', { name: 'Yearly Sales Revenue -' })).toBeVisible();
  await page
    .locator(
      'div:nth-child(4) > .buster-resize-columns > .react-split > .react-split__pane > div > div:nth-child(2) > .bg-background > div'
    )
    .first()
    .click();
  await expect(page.getByRole('button', { name: 'Start chat' })).toBeVisible();
  await page.getByTestId('save-to-dashboard-button').click();
  await page
    .getByRole('menuitemcheckbox', { name: 'Important Metrics' })
    .getByRole('checkbox')
    .click();
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByTestId('share-button')).toBeVisible();
  await expect(page.getByTestId('three-dot-menu-button')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start chat' })).toBeVisible();
});
