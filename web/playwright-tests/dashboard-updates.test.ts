import { expect, test } from '@playwright/test';

test.describe
  .serial('dashboard updates', () => {
    test('Go to dashboard', async ({ page }) => {
      await page.goto('http://localhost:3000/app/dashboards');
      await expect(page.getByText('Dashboards').nth(1)).toBeVisible();
      await expect(page.getByRole('button', { name: 'New dashboard' })).toBeVisible();
      await expect(page.getByRole('button', { name: '12px star' })).toBeVisible();
      await page.getByRole('link', { name: 'Important Metrics 12px star' }).click();
      await page.waitForTimeout(100);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByRole('textbox', { name: 'New dashboard' })).toHaveValue(
        'Important Metrics'
      );
    });

    test('Can remove a metric from a dashboard', async ({ page }) => {
      await page.goto('http://localhost:3000/app/dashboards/c0855f0f-f50a-424e-9e72-9e53711a7f6a');
      await expect(
        page.getByTestId('metric-item-45848c7f-0d28-52a0-914e-f3fc1b7d4180')
      ).toBeVisible();
      await page
        .locator('div')
        .filter({ hasText: /^DashboardFileStart chat$/ })
        .getByRole('button')
        .nth(2)
        .click();
      await page
        .getByTestId('item-45848c7f-0d28-52a0-914e-f3fc1b7d4180')
        .getByRole('checkbox')
        .click();
      await expect(page.getByRole('button', { name: 'Remove metrics' })).toBeVisible();
      await page.getByRole('button', { name: 'Remove metrics' }).click();
      await page
        .locator('div')
        .filter({ hasText: /^DashboardFileStart chat$/ })
        .getByRole('button')
        .nth(2)
        .click();
      await page.getByRole('textbox', { name: 'Search...' }).click();
      await page.getByRole('textbox', { name: 'Search...' }).fill('Revenue by product category');
      await page.waitForTimeout(250);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      await page
        .locator('div:nth-child(2) > div > div:nth-child(2) > div > .border-border > div > .peer')
        .click();
      await expect(page.getByText('Revenue by Product Category (Q2 2023 - Q1 2024)')).toBeVisible();
      await page.getByRole('button', { name: 'Add metrics' }).click();
      await page.waitForTimeout(250);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      await expect(
        page.getByTestId('metric-item-45848c7f-0d28-52a0-914e-f3fc1b7d4180')
      ).toBeVisible();

      //drag back into place
      // Use a more specific selector if the element is a link
      const sourceElement = page.getByTestId('metric-item-72e445a5-fb08-5b76-8c77-1642adf0cb72');
      const targetElement = page.getByTestId('metric-item-45848c7f-0d28-52a0-914e-f3fc1b7d4180');

      expect(sourceElement).toBeVisible();
      expect(targetElement).toBeVisible();

      // Scroll the target element into view since it's at the bottom of the page
      await targetElement.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500); // Give time for scroll to complete

      const sourceBoundingBox = await sourceElement.boundingBox();
      const targetBoundingBox = await targetElement.boundingBox();

      if (!sourceBoundingBox || !targetBoundingBox) {
        throw new Error('Source or target element not found');
      }

      if (sourceBoundingBox && targetBoundingBox) {
        // Swap the logic: drag FROM target TO source
        const startX = targetBoundingBox.x + targetBoundingBox.width / 2;
        const startY = targetBoundingBox.y + targetBoundingBox.height / 2;
        const endX = sourceBoundingBox.x + sourceBoundingBox.width / 2;
        const endY = sourceBoundingBox.y + sourceBoundingBox.height / 2;

        // Start from the target element position
        await page.mouse.move(startX, startY);
        await page.waitForTimeout(300);
        await page.mouse.down();
        await page.waitForTimeout(300);

        // Move to source element position with a slower motion
        const steps = 35;
        for (let i = 0; i <= steps; i++) {
          const stepX = startX + (endX - startX) * (i / steps);
          const stepY = startY + (endY - startY) * (i / steps);
          await page.mouse.move(stepX, stepY);
          await page.waitForTimeout(33);
        }

        await page.waitForTimeout(100);
        await page.mouse.up();
        await page.waitForTimeout(100);
      }

      // Verify the element was moved successfully
      await expect(sourceElement).toBeVisible();
      await page.getByRole('textbox', { name: 'New dashboard' }).click();
      await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(250);
      await page.waitForLoadState('networkidle');
    });

    test('Can edit name and description of a dashboard', async ({ page }) => {
      await page.goto('http://localhost:3000/app/dashboards/c0855f0f-f50a-424e-9e72-9e53711a7f6a');
      await expect(page.getByRole('textbox', { name: 'Add description...' })).toHaveValue('');

      await page.getByRole('textbox', { name: 'New dashboard' }).click();
      await page
        .getByRole('textbox', { name: 'New dashboard' })
        .fill('Important Metrics NATE RULES');
      await page.getByRole('textbox', { name: 'Add description...' }).click();
      await page.getByRole('textbox', { name: 'Add description...' }).fill('HUH?');
      await expect(page.getByRole('textbox', { name: 'New dashboard' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'New dashboard' })).toHaveValue(
        'Important Metrics NATE RULES'
      );
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(100);
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('textbox', { name: 'New dashboard' })).toHaveValue(
        'Important Metrics NATE RULES'
      );
      await page.getByRole('textbox', { name: 'New dashboard' }).click();
      await page.getByRole('textbox', { name: 'New dashboard' }).fill('Important Metrics');
      await page.getByRole('textbox', { name: 'Add description...' }).click();
      await expect(page.getByRole('textbox', { name: 'Add description...' })).toHaveValue('HUH?');

      await expect(page.getByRole('textbox', { name: 'New dashboard' })).toHaveValue(
        'Important Metrics'
      );
      await page.getByRole('textbox', { name: 'Add description...' }).fill('');
      await expect(page.getByRole('textbox', { name: 'Add description...' })).toBeEmpty();
      await page.getByRole('textbox', { name: 'New dashboard' }).click();
      await page.getByRole('textbox', { name: 'New dashboard' }).fill('Important Metrics SWAG');
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(400);
      await page.waitForLoadState('networkidle');
      await page.getByTestId('segmented-trigger-file').click();
      await page.getByTestId('segmented-trigger-file').click();
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');

      await expect(page.getByRole('code').getByText('Important Metrics SWAG')).toBeVisible({
        timeout: 22000
      });
      await expect(page.locator('.current-line').first()).toBeVisible();
      await page.getByTestId('segmented-trigger-dashboard').click();
      await page.getByRole('textbox', { name: 'New dashboard' }).click();
      await page.getByRole('textbox', { name: 'New dashboard' }).fill('Important Metrics');
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByRole('textbox', { name: 'New dashboard' })).toHaveValue(
        'Important Metrics'
      );
    });
  });
