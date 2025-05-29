import { test, expect } from '@playwright/test';

test.describe
  .serial('Line chart - axis tests', () => {
    test.skip('Line chart - x axis rotation', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/635d9b06-afb1-5b05-8130-03c0b7a04bcb/chart?secondary_view=chart-edit'
      );
      await page
        .locator('div')
        .filter({ hasText: /^X-Axis$/ })
        .getByRole('button')
        .click();
      await page.getByTestId('segmented-trigger-45').click();
      expect(page.getByTestId('segmented-trigger-45')).toHaveAttribute('data-state', 'active');
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(50);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(50);
      await page
        .locator('div')
        .filter({ hasText: /^X-Axis$/ })
        .getByRole('button')
        .click();
      expect(page.getByTestId('segmented-trigger-45')).toHaveAttribute('data-state', 'active');
      await page.getByTestId('segmented-trigger-auto').click();
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(50);
      await page.waitForLoadState('networkidle');
    });

    test('Line chart - line title', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/635d9b06-afb1-5b05-8130-03c0b7a04bcb/chart?secondary_view=chart-edit'
      );
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
      await page.getByRole('textbox', { name: 'Avg Revenue Per Customer' }).click();
      await page.getByRole('textbox', { name: 'Avg Revenue Per Customer' }).fill('NATE RULEZ');
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(250);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toMatchAriaSnapshot(`
    - textbox "New chart": /Average Revenue per Customer \\(Quarterly\\) \\(Q2 \\d+ - Q1 \\d+\\)/
    - text: /Q2 \\d+ - Q1 \\d+ • What is the average revenue generated per customer quarterly from Q2 \\d+ to Q1 \\d+\\?/
    - img
    `);
      await expect(page.getByTestId('select-axis-drop-zone-yAxis')).toContainText('NATE RULEZ');
      await page.getByRole('textbox', { name: 'NATE RULEZ' }).click();
      await page.getByRole('textbox', { name: 'NATE RULEZ' }).press('ControlOrMeta+a');
      await page.getByRole('textbox', { name: 'NATE RULEZ' }).fill('');
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(50);
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('select-axis-drop-zone-yAxis')).not.toContainText('NATE RULEZ');
    });

    test('Line chart - line settings', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/635d9b06-afb1-5b05-8130-03c0b7a04bcb/chart?secondary_view=chart-edit'
      );
      await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
      await page.getByTestId('segmented-trigger-dot-line').click();
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(120);
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('segmented-trigger-dot-line')).toHaveAttribute(
        'data-state',
        'active'
      );
      await expect(page.locator('body')).toMatchAriaSnapshot(`
    - textbox "New chart": /Average Revenue per Customer \\(Quarterly\\) \\(Q2 \\d+ - Q1 \\d+\\)/
    - text: /Q2 \\d+ - Q1 \\d+ • What is the average revenue generated per customer quarterly from Q2 \\d+ to Q1 \\d+\\?/
    - img
    `);
      await page.getByTestId('segmented-trigger-step').click();
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(120);
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('segmented-trigger-step')).toHaveAttribute(
        'data-state',
        'active'
      );
      await page.waitForTimeout(100);
      await page.getByTestId('segmented-trigger-line').click();
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(50);
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('segmented-trigger-line')).toHaveAttribute(
        'data-state',
        'active'
      );
    });

    test('Line chart - data labels', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/635d9b06-afb1-5b05-8130-03c0b7a04bcb/chart?secondary_view=chart-edit'
      );
      await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
      await page.getByRole('switch').click();
      await expect(page.getByRole('switch')).toBeVisible();
      await expect(page.getByRole('switch')).toHaveAttribute('data-state', 'checked');

      await page.getByRole('button', { name: 'Reset' }).click();
      await expect(page.getByRole('switch')).not.toHaveAttribute('data-state', 'checked');
    });

    test('Line chart - styling updates - data labels', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/635d9b06-afb1-5b05-8130-03c0b7a04bcb/chart?secondary_view=chart-edit'
      );
      await page.getByTestId('segmented-trigger-Styling').click();
      await page
        .locator('div')
        .filter({ hasText: /^Data labels$/ })
        .getByRole('switch')
        .click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Data labels$/ })
          .getByRole('switch')
      ).toHaveAttribute('data-state', 'checked');
      await page.waitForTimeout(150);
      await page.getByRole('button', { name: 'Reset' }).click();
      await page.waitForTimeout(150);
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Data labels$/ })
          .getByRole('switch')
      ).toHaveAttribute('data-state', 'unchecked');
    });

    test('Line chart - styling updates - grid lines', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/635d9b06-afb1-5b05-8130-03c0b7a04bcb/chart?secondary_view=chart-edit'
      );
      await page.getByTestId('segmented-trigger-Styling').click();
      await page
        .locator('div')
        .filter({ hasText: /^Grid lines$/ })
        .getByRole('switch')
        .click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Grid lines$/ })
          .getByRole('switch')
      ).toHaveAttribute('data-state', 'unchecked');
      await page.getByRole('button', { name: 'Reset' }).click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Grid lines$/ })
          .getByRole('switch')
      ).toHaveAttribute('data-state', 'checked');
    });

    test('Line chart - styling updates - hide y-axis', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/635d9b06-afb1-5b05-8130-03c0b7a04bcb/chart?secondary_view=chart-edit'
      );
      await page.getByTestId('segmented-trigger-Styling').click();
      await page
        .locator('div')
        .filter({ hasText: /^Hide y-axis$/ })
        .getByRole('switch')
        .click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Hide y-axis$/ })
          .getByRole('switch')
      ).toHaveAttribute('data-state', 'checked');
      await page.getByRole('button', { name: 'Reset' }).click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Hide y-axis$/ })
          .getByRole('switch')
      ).toHaveAttribute('data-state', 'unchecked');
    });

    test('Line chart - styling updates - smooth lines', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/635d9b06-afb1-5b05-8130-03c0b7a04bcb/chart?secondary_view=chart-edit'
      );
      await page.getByTestId('segmented-trigger-Styling').click();
      await page
        .locator('div')
        .filter({ hasText: /^Smooth lines$/ })
        .getByRole('switch')
        .click();
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(50);
      await page.waitForLoadState('networkidle');

      await page.reload();
      await page.getByTestId('segmented-trigger-Styling').click();

      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Smooth lines$/ })
          .getByRole('switch')
      ).toHaveAttribute('data-state', 'checked');
      await page
        .locator('div')
        .filter({ hasText: /^Smooth lines$/ })
        .getByRole('switch')
        .click();
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(50);
      await page.waitForLoadState('networkidle');
      await page.reload();
      await page.getByTestId('segmented-trigger-Styling').click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Smooth lines$/ })
          .getByRole('switch')
      ).toHaveAttribute('data-state', 'unchecked');
    });

    test('Line chart - styling updates - dots on lines', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/635d9b06-afb1-5b05-8130-03c0b7a04bcb/chart?secondary_view=chart-edit'
      );
      await page.getByTestId('segmented-trigger-Styling').click();
      await page
        .locator('div')
        .filter({ hasText: /^Dot on lines$/ })
        .getByRole('switch')
        .click();
      await page.getByRole('button', { name: 'Save' }).click();

      await page.reload();
      await page.getByTestId('segmented-trigger-Styling').click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Dot on lines$/ })
          .getByRole('switch')
      ).toHaveAttribute('data-state', 'checked');

      await page.reload();
      await page.getByTestId('segmented-trigger-Styling').click();
      await page
        .locator('div')
        .filter({ hasText: /^Dot on lines$/ })
        .getByRole('switch')
        .click();
      await page.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(50);
      await page.waitForLoadState('networkidle');
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Dot on lines$/ })
          .getByRole('switch')
      ).toHaveAttribute('data-state', 'unchecked');
    });

    test('Line chart - when legend headline is turned it it also turns on show legend', async ({
      page
    }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/635d9b06-afb1-5b05-8130-03c0b7a04bcb/chart?secondary_view=chart-edit'
      );
      await page.getByTestId('segmented-trigger-Styling').click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Show legend$/ })
          .getByRole('switch')
      ).toHaveAttribute('data-state', 'unchecked');
      await page.getByRole('combobox').filter({ hasText: 'None' }).click();
      await page.getByRole('option', { name: 'Current' }).click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Show legend$/ })
          .getByRole('switch')
      ).toHaveAttribute('data-state', 'checked');

      await page.getByRole('combobox').filter({ hasText: 'Current' }).click();
      await page.getByRole('option', { name: 'None' }).click();
      await page.getByRole('button', { name: 'Reset' }).click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Show legend$/ })
          .getByRole('switch')
      ).toHaveAttribute('data-state', 'unchecked');
    });

    test('Line chart - can reset colors', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/635d9b06-afb1-5b05-8130-03c0b7a04bcb/chart?secondary_view=chart-edit'
      );
      await page.getByTestId('segmented-trigger-Styling').click();
      await page.getByTestId('segmented-trigger-Colors').click();
      await page.getByTestId('segmented-trigger-Monochrome').click();
      await page.locator('div').filter({ hasText: /^Red$/ }).first().click();
      await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
      await page.getByRole('button', { name: 'Reset' }).click();
      await expect(page.getByRole('button', { name: 'Reset' })).not.toBeVisible();
    });

    test('Line chart - when trying to navigate away it will warn you', async ({ page }) => {
      await page.goto(
        'http://localhost:3000/app/metrics/635d9b06-afb1-5b05-8130-03c0b7a04bcb/chart?secondary_view=chart-edit'
      );
      await page.getByTestId('segmented-trigger-Styling').click();
      await page.getByTestId('segmented-trigger-Colors').click();
      await page.getByTestId('segmented-trigger-Monochrome').click();
      await page.locator('div').filter({ hasText: /^Red$/ }).first().click();
      await page.getByTestId('segmented-trigger-results').click();
      await expect(page.getByRole('button', { name: 'Discard changes' })).toBeVisible();
      await page.getByRole('button').filter({ hasText: /^$/ }).click();
      await expect(page.getByRole('button', { name: 'Discard changes' })).not.toBeVisible();
      await page.getByRole('button', { name: 'Reset' }).click();
      await page.getByTestId('segmented-trigger-results').click();
      const expectedURL =
        'http://localhost:3000/app/metrics/635d9b06-afb1-5b05-8130-03c0b7a04bcb/results';
      await expect(page.getByRole('button', { name: 'Discard changes' })).not.toBeVisible();
      await expect(page).toHaveURL(expectedURL, { timeout: 15000 });
    });
  });
