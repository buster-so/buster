import { expect, test } from '@playwright/test';

test.describe
  .serial('Pie chart styling updates', async () => {
    test('Pie chart - can put string column on x axis', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/88f342bf-19f9-53a9-87c6-804399e69644/chart'
      );
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await page.getByTestId('select-chart-type-pie').click();
      await page.waitForTimeout(250);
      const sourceElement = page
        .getByTestId('select-axis-available-items-list')
        .getByRole('button')
        .first();
      const targetElement = page
        .getByTestId('select-axis-drop-zone-xAxis')
        .locator('div')
        .filter({ hasText: /^Drag column here$/ });

      expect(sourceElement).toBeVisible();
      expect(targetElement).toBeVisible();

      const sourceBoundingBox = await sourceElement.boundingBox();
      const targetBoundingBox = await targetElement.boundingBox();

      if (sourceBoundingBox && targetBoundingBox) {
        // Start at the center of the source element
        await page.mouse.move(
          sourceBoundingBox.x + sourceBoundingBox.width / 2,
          sourceBoundingBox.y + sourceBoundingBox.height / 2
        );
        await page.mouse.down();

        // Move to target in small increments
        const steps = 30;
        const dx = (targetBoundingBox.x - sourceBoundingBox.x) / steps;
        const dy = (targetBoundingBox.y - sourceBoundingBox.y) / steps;

        for (let i = 0; i <= steps; i++) {
          await page.mouse.move(
            sourceBoundingBox.x + dx * i + sourceBoundingBox.width / 2,
            sourceBoundingBox.y + dy * i + sourceBoundingBox.height / 2,
            { steps: 1 }
          );
          await page.waitForTimeout(1); // Add a small delay between each movement
        }

        await page.mouse.up();
      }

      await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(125);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(125);
      await expect(page.getByRole('button', { name: 'Reset' })).toBeHidden();
    });

    test('Pie chart span clicking works', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/88f342bf-19f9-53a9-87c6-804399e69644/chart'
      );
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await page.waitForTimeout(255);
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await page.waitForTimeout(255);
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await page.waitForTimeout(255);
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await page.waitForTimeout(255);
      await page.getByTestId('segmented-trigger-results').click();
      await page.waitForTimeout(555);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await expect(page.getByTestId('metric-view-chart-content').getByRole('img')).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'New chart' })).toHaveValue(
        'Top 10 Products by Revenue (Last 4 Quarters)'
      );
      await page.waitForTimeout(555);
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      await expect(page.getByText('Edit chart')).toBeVisible();
      await page
        .locator('div')
        .filter({ hasText: /^Edit chart$/ })
        .getByRole('button')
        .click();
      await page.waitForTimeout(55);
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await page.waitForTimeout(55);
      await page
        .locator('div')
        .filter({ hasText: /^Edit chart$/ })
        .getByRole('button')
        .click();
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await page.waitForTimeout(55);
      await page
        .locator('div')
        .filter({ hasText: /^Edit chart$/ })
        .getByRole('button')
        .click();
    });

    test('Pie chart - legend clicks work', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/88f342bf-19f9-53a9-87c6-804399e69644/chart'
      );
      await page.getByText('Touring-1000 Yellow,').click();
      await page.getByText('Road-350-W Yellow, 40').click();
      await page.getByText('Touring-1000 Blue,').click();
      await page.getByText('Road-350-W Yellow, 48').click();
      await expect(page.locator('.dot > .w-4\\.5').first()).toBeVisible();
      await expect(page.locator('div:nth-child(2) > div > .dot > .w-4\\.5')).toBeVisible();
      await page.locator('.dot > .w-4\\.5').first().click();
      await page.getByText('Road-350-W Yellow, 40').click();
      await page.getByText('Touring-1000 Blue,').click();
      await page.getByText('Road-350-W Yellow, 48').click();
      await page.getByText('Next').click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Mountain-200 Silver, 42$/ })
          .nth(2)
      ).toBeVisible();
    });

    test('Pie chart - can disable tooltip', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/88f342bf-19f9-53a9-87c6-804399e69644/chart'
      );
      await page.getByTestId('edit-chart-button').getByRole('button').click();
      await page.getByTestId('select-axis-drop-zone-tooltip').getByRole('button').click();
      await expect(page.getByRole('switch')).toHaveAttribute('data-state', 'unchecked');
      await page.getByRole('switch').click();
      await expect(page.getByRole('switch')).toHaveAttribute('data-state', 'checked');
      await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(25);
      await page.waitForLoadState('networkidle');

      await page.reload();
      await page.getByTestId('select-axis-drop-zone-tooltip').getByRole('button').click();
      await expect(page.getByRole('switch')).toHaveAttribute('data-state', 'checked');
      await page.getByRole('switch').click();
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(25);
      await page.waitForLoadState('networkidle');
    });

    test('Pie chart - styling updates - can change label as', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/88f342bf-19f9-53a9-87c6-804399e69644/chart?secondary_view=chart-edit'
      );
      await page.getByTestId('segmented-trigger-Styling').click();
      await expect(page.getByTestId('segmented-trigger-number')).toHaveAttribute(
        'data-state',
        'active'
      );
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Show label$/ })
          .getByRole('switch')
      ).toHaveAttribute('data-state', 'unchecked');
      await page.getByTestId('segmented-trigger-percent').click();
      await page
        .locator('div')
        .filter({ hasText: /^Show label$/ })
        .getByRole('switch')
        .click();
      await expect(page.getByTestId('segmented-trigger-percent')).toHaveAttribute(
        'data-state',
        'active'
      );
      await page.getByRole('button', { name: 'Reset' }).click();
      await expect(page.getByTestId('segmented-trigger-number')).toHaveAttribute(
        'data-state',
        'active'
      );
      await page.getByTestId('segmented-trigger-pie').click();
      await expect(page.getByTestId('segmented-trigger-pie')).toBeVisible();
      await page.getByTestId('segmented-trigger-pie').click();
      await page.waitForTimeout(60);
      await page.getByTestId('segmented-trigger-donut').click();
      await page.waitForTimeout(50);
      await expect(page.getByTestId('segmented-trigger-donut')).toBeVisible();
      await expect(page.getByText('Donut width')).toBeVisible();
      await page.getByTestId('segmented-trigger-pie').click();
      await expect(page.getByText('Donut width')).not.toBeVisible();
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(25);
      await page.waitForLoadState('networkidle');

      await page.reload();
      await page.getByTestId('segmented-trigger-Styling').click();
      await expect(page.getByText('Donut width')).not.toBeVisible();
      await page.getByTestId('segmented-trigger-donut').click();
      await expect(page.getByText('Donut width')).toBeVisible();
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(25);
      await page.waitForLoadState('networkidle');
    });

    test('Donut chart - minimum slice percentage', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/88f342bf-19f9-53a9-87c6-804399e69644/chart?secondary_view=chart-edit'
      );
      await page.getByTestId('segmented-trigger-Styling').click();
      await page
        .locator('div')
        .filter({ hasText: /^Minimum slice %$/ })
        .getByRole('spinbutton')
        .click();
      await page
        .locator('div')
        .filter({ hasText: /^Minimum slice %$/ })
        .getByRole('spinbutton')
        .press('ArrowLeft');
      await page
        .locator('div')
        .filter({ hasText: /^Minimum slice %$/ })
        .getByRole('spinbutton')
        .fill('80');
      await expect(page.getByText('Mountain-200 Black,')).toBeVisible();
      await page
        .locator('div')
        .filter({ hasText: /^Minimum slice %$/ })
        .getByRole('spinbutton')
        .click();
      await page
        .locator('div')
        .filter({ hasText: /^Minimum slice %$/ })
        .getByRole('spinbutton')
        .fill('10');
      await expect(page.getByText('Mountain-200 Silver,')).toBeVisible();
      await page.getByRole('button', { name: 'Reset' }).click();
      await expect(
        page.getByTestId('metric-view-chart-content').getByText('Touring-1000 Yellow,')
      ).toBeVisible();
    });

    test('Donut chart - inner label location', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/88f342bf-19f9-53a9-87c6-804399e69644/chart?secondary_view=chart-edit'
      );
      await page.getByTestId('segmented-trigger-Styling').click();
      await expect(page.getByText('Touring-1000 Yellow,')).toBeVisible();
      await expect(page.locator('body')).toContainText('Sum');
      await page.locator('html').click();
      await page.getByRole('combobox').filter({ hasText: 'Sum' }).click();
      await page.getByRole('option', { name: 'Median' }).click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Title$/ })
          .getByRole('textbox')
      ).toHaveValue('Median');
      await page.getByRole('button', { name: 'Save' }).click();

      await page.waitForTimeout(25);
      await page.waitForLoadState('networkidle');

      await page.reload();
      await page.getByTestId('segmented-trigger-Styling').click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Title$/ })
          .getByRole('textbox')
      ).toHaveValue('Median');
      await expect(page.getByRole('combobox').filter({ hasText: 'Median' })).toBeVisible();
      await page
        .locator('div')
        .filter({ hasText: /^Show inner label$/ })
        .getByRole('switch')
        .click();
      await expect(page.getByRole('combobox').filter({ hasText: 'Median' })).not.toBeVisible();

      await page.getByRole('switch').nth(2).click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Title$/ })
          .getByRole('textbox')
      ).toHaveValue('Median');
      await page.getByRole('combobox').filter({ hasText: 'Median' }).click();
      await page.getByRole('option', { name: 'Sum' }).click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Title$/ })
          .getByRole('textbox')
      ).toHaveValue('Sum');
      await page.getByRole('button', { name: 'Reset' }).click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Title$/ })
          .getByRole('textbox')
      ).toHaveValue('Median');
      await page.getByRole('combobox').filter({ hasText: 'Median' }).click();
      await page.getByRole('option', { name: 'Sum' }).click();
      await page
        .locator('div')
        .filter({ hasText: /^Title$/ })
        .getByRole('textbox')
        .click();
      await page
        .locator('div')
        .filter({ hasText: /^Title$/ })
        .getByRole('textbox')
        .press('ControlOrMeta+a');
      await page
        .locator('div')
        .filter({ hasText: /^Title$/ })
        .getByRole('textbox')
        .fill('Total');
      await page.getByRole('button', { name: 'Save' }).click();

      await page.waitForTimeout(25);
      await page.waitForLoadState('networkidle');
    });

    test('Donut chart - legend headers', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/88f342bf-19f9-53a9-87c6-804399e69644/chart?secondary_view=chart-edit'
      );
      await page.getByTestId('segmented-trigger-Styling').click();
      await page
        .locator('div')
        .filter({ hasText: /^Show legend$/ })
        .getByRole('switch')
        .click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Show legend$/ })
          .getByRole('switch')
      ).toHaveAttribute('data-state', 'unchecked');

      await page.getByRole('combobox').filter({ hasText: 'None' }).click();
      await page.getByRole('option', { name: 'Current' }).click();
      await expect(
        page.locator('#metric-chart-container-88f342bf-19f9-53a9-87c6-804399e69644')
      ).toContainText('$1,357,446.78');
      await page.getByRole('button', { name: 'Reset' }).click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Show legend$/ })
          .getByRole('switch')
      ).toHaveAttribute('data-state', 'checked');
    });

    test('Donut chart - reset', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/88f342bf-19f9-53a9-87c6-804399e69644/chart?secondary_view=chart-edit'
      );
      await expect(page.getByTestId('metric-view-chart-content').getByRole('img')).toBeVisible();
      await page.getByTestId('select-axis-drop-zone-xAxis').getByTestId('delete-button').click();
      await expect(page.getByText('No valid axis selected')).toBeVisible();
      await page.getByTestId('select-chart-type-column').click();

      await page.waitForTimeout(55);
      const sourceElement = page
        .getByTestId('select-axis-available-items-list')
        .getByRole('button')
        .first();
      const targetElement = page
        .getByTestId('select-axis-drop-zone-xAxis')
        .locator('div')
        .filter({ hasText: /^Drag column here$/ });
      const sourceBoundingBox = await sourceElement.boundingBox();
      const targetBoundingBox = await targetElement.boundingBox();

      if (sourceBoundingBox && targetBoundingBox) {
        // Start at the center of the source element
        await page.mouse.move(
          sourceBoundingBox.x + sourceBoundingBox.width / 2,
          sourceBoundingBox.y + sourceBoundingBox.height / 2
        );
        await page.mouse.down();

        // Move to target in small increments
        const steps = 30;
        const dx = (targetBoundingBox.x - sourceBoundingBox.x) / steps;
        const dy = (targetBoundingBox.y - sourceBoundingBox.y) / steps;

        for (let i = 0; i <= steps; i++) {
          await page.mouse.move(
            sourceBoundingBox.x + dx * i + sourceBoundingBox.width / 2,
            sourceBoundingBox.y + dy * i + sourceBoundingBox.height / 2,
            { steps: 1 }
          );
          await page.waitForTimeout(1); // Add a small delay between each movement
        }

        await page.mouse.up();
      }
      await page.waitForTimeout(55);
      await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(25);
      await page.waitForLoadState('networkidle');
    });
  });
