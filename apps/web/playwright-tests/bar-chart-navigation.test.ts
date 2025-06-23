import { expect, test } from '@playwright/test';

test.describe
  .serial('Bar chart navigation', () => {
    test('Can click close icon in edit chart mode', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/9c94612e-348e-591c-bc80-fd24d556dcf7/chart?secondary_view=chart-edit'
      );

      await page
        .locator('div')
        .filter({ hasText: /^Edit chart$/ })
        .getByRole('button')
        .click();
      expect(page.url()).toBe(
        'http://localhost:3000/app/metrics/9c94612e-348e-591c-bc80-fd24d556dcf7/chart'
      );
      await expect(page.locator('div').filter({ hasText: /^Edit chart$/ })).not.toBeVisible();

      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await expect(page.locator('div').filter({ hasText: /^Edit chart$/ })).toBeVisible();
    });

    test('Can click start chat', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/9c94612e-348e-591c-bc80-fd24d556dcf7/chart'
      );
      await page.getByRole('button', { name: 'Start chat' }).click();
      await page.waitForTimeout(100);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      await expect(page.getByRole('textbox', { name: 'New chart' })).toBeVisible();
      await page.getByRole('textbox', { name: 'New chart' }).dblclick();
      await page.getByRole('textbox', { name: 'New chart' }).press('ControlOrMeta+c');

      await expect(
        page.getByText(
          'Top 10 Products by Revenue (Q2 2023 - Q1 2024) has been pulled into a new chat.'
        )
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
      await page.waitForTimeout(100);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');

      await expect(page).toHaveURL('http://localhost:3000/app/chats', { timeout: 30000 });
    });

    test('Can add and remove from favorites', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/9c94612e-348e-591c-bc80-fd24d556dcf7/chart'
      );
      await page.getByTestId('three-dot-menu-button').click();
      await page.getByRole('menuitem', { name: 'Add to favorites' }).click();
      await page.waitForTimeout(100);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');

      await expect(page.getByRole('link', { name: 'Top 10 Products' })).toBeVisible();

      await page.getByTestId('three-dot-menu-button').click();
      await page.getByRole('menuitem', { name: 'Remove from favorites' }).click();
      await expect(page.getByRole('link', { name: 'Top 10 Products' })).toBeHidden();
    });

    test('Can open sql editor', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/9c94612e-348e-591c-bc80-fd24d556dcf7/chart'
      );
      await expect(page.getByTestId('segmented-trigger-sql')).toBeVisible();
      await page.getByTestId('segmented-trigger-sql').click();
      await page.waitForTimeout(100);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      await expect(page.getByRole('button', { name: 'Run' })).toBeVisible();
      await expect(page.getByTestId('segmented-trigger-sql')).toHaveAttribute(
        'data-state',
        'active'
      );
    });

    test('Bar chart span clicking works', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/9c94612e-348e-591c-bc80-fd24d556dcf7/chart'
      );
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await page.waitForTimeout(250);
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await page.waitForTimeout(250);
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await page.waitForTimeout(250);
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await page.waitForTimeout(250);
      await page.getByTestId('segmented-trigger-sql').click();
      await page.waitForTimeout(250);
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await expect(page.getByTestId('metric-view-chart-content').getByRole('img')).toBeVisible();
      await page.getByTestId('segmented-trigger-sql').click();
      await page.waitForTimeout(250);
      await expect(page.getByText('Copy SQLSaveRun')).toBeVisible();
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');

      await expect(page.getByRole('textbox', { name: 'New chart' })).toBeVisible();

      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await expect(page.getByText('Edit chart')).toBeVisible({ timeout: 15000 });
    });

    test('Can navigate to bar chart from favorites', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/9c94612e-348e-591c-bc80-fd24d556dcf7/chart'
      );
      await page.getByTestId('three-dot-menu-button').click();
      await expect(page.getByText('Add to favorites')).toBeVisible();
      await page.getByRole('menuitem', { name: 'Add to favorites' }).click();
      await expect(page.getByRole('link', { name: 'Top 10 Products' })).toBeVisible();
      await page.getByRole('link', { name: 'Home' }).click();
      await page.reload();
      await page.waitForTimeout(100);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      await page.getByRole('link', { name: 'Top 10 Products' }).click();
      await expect(page.getByTestId('metric-view-chart-content')).toBeVisible();
      await page.getByRole('link', { name: 'Top 10 Products' }).getByRole('button').click();
      await page.waitForTimeout(100);
      await page.waitForLoadState('networkidle');
    });
  });
