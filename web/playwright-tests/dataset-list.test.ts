import { test, expect } from '@playwright/test';

test.describe.serial('Dataset tests', () => {
  let datasetURL = '';
  test('Can navigate to a dataset chart from the dataset list', async ({ page }) => {
    await page.goto('http://localhost:3000/app/home');
    await page.getByRole('link', { name: 'Datasets' }).click();

    await expect(
      page
        .locator('div')
        .filter({ hasText: /^Title$/ })
        .first()
    ).toBeVisible({ timeout: 3000 });

    // .list-container
    await page.locator('.list-container').getByRole('link').first().click();

    //overview
    await page.waitForURL((url) => url.toString().includes('overview'));
    expect(page.url()).toContain('overview');

    //set the current dataset url
    datasetURL = page.url();
  });

  test('Can navigate to different dataset pages', async ({ page }) => {
    await page.goto(datasetURL);

    await page.getByRole('tab', { name: 'Permissions' }).click();
    await page.waitForURL((url) => url.toString().includes('permissions'));
    expect(page.url()).toContain('permissions');

    await page.getByRole('tab', { name: 'Editor' }).click();
    await page.waitForURL((url) => url.toString().includes('editor'));
    expect(page.url()).toContain('editor');

    await page.getByRole('tab', { name: 'Overview' }).click();
    await page.waitForURL((url) => url.toString().includes('overview'));
    expect(page.url()).toContain('overview');
  });
});
