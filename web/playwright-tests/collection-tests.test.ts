import { test, expect } from '@playwright/test';

test.describe
  .serial('collection tests', () => {
    test('Can create a collection', async ({ page }) => {
      await page.goto('http://localhost:3000/app/collections');
      await page.getByRole('button', { name: 'New Collection' }).click();
      await page.getByRole('textbox', { name: 'Collection title' }).click();
      await page.getByRole('textbox', { name: 'Collection title' }).fill('My cool test');
      await page.getByRole('button', { name: 'Create collection' }).click();

      await expect(
        page.getByRole('main').getByRole('button', { name: 'Add to collection' })
      ).toBeVisible();
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');

      await page.getByTestId('collection-three-dot-dropdown').click();
      await page.getByRole('menuitem', { name: 'Rename collection' }).click();
      await page.getByRole('textbox', { name: 'Enter collection name' }).fill('Nate rulez!');
      await page.getByRole('button', { name: 'Rename' }).click();
      await page.waitForTimeout(250);
      await page.waitForLoadState('networkidle');
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      await expect(
        page.getByLabel('breadcrumb').getByRole('link', { name: 'Nate rulez!' })
      ).toBeVisible();
      await page.getByTestId('collection-three-dot-dropdown').click();
      await page.getByRole('menuitem', { name: 'Delete collection' }).click();
      await page.getByRole('button', { name: 'Submit' }).click();
      await page.waitForTimeout(250);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      expect(page.url()).toBe('http://localhost:3000/app/collections');
    });

    test('Can add a metric to a collection', async ({ page }) => {
      await page.goto('http://localhost:3000/app/collections');
      await page.getByRole('link', { name: 'Important Things' }).click();
      await page.getByRole('button', { name: 'Add to collection' }).click();
      await page.waitForTimeout(550);

      await page.getByText('Yearly Sales Revenue -').click();

      await page.getByRole('button', { name: 'Add assets' }).click();
      await expect(page.getByRole('link', { name: 'Yearly Sales Revenue -' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Quarterly Revenue Report (' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Quarterly Revenue Growth Rate' })).toBeVisible();
      await page.getByRole('button', { name: 'Add to collection' }).click();
      await page.waitForTimeout(50);
      await page.waitForLoadState('networkidle');
      await page
        .getByLabel('Input Modal')
        .locator('div')
        .filter({
          hasText: /^Yearly Sales Revenue - Signature Cycles Products \(Last 3 Years \+ YTD\)$/
        })
        .first()
        .click();
      await page.getByRole('button', { name: 'Remove assets' }).click();
      await page.waitForTimeout(50);
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('link', { name: 'Yearly Sales Revenue -' })).toBeHidden();
    });

    test('Complex collection click through', async ({ page }) => {
      await page.goto('http://localhost:3000/app/collections/0ac43ae2-beda-4007-9574-71a17425da0a');
      await page.getByRole('link', { name: 'Quarterly Revenue Growth Rate' }).click();
      await page.waitForTimeout(150);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      await expect(page.getByTestId('metric-view-chart-content').getByRole('img')).toBeVisible();
      await page.goBack();
      await expect(page.getByRole('link', { name: 'Important Things' })).toBeVisible();
      await page.waitForTimeout(150);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      await page.getByRole('link', { name: 'Revenue by Sales Territory (' }).click();
      await page.getByRole('button', { name: 'Start chat' }).click();
      await page.waitForTimeout(150);
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('chat-response-message-file')).toBeVisible();
      await page.waitForTimeout(150);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      await page.goBack();
      await page.waitForTimeout(150);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      await page.goBack();
      await page.waitForTimeout(150);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      await page.goBack();
      await page.waitForTimeout(150);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      await expect(page.getByRole('textbox', { name: 'New chart' })).not.toBeVisible();
    });
  });
