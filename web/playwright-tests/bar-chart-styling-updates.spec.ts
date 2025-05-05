import { test, expect } from '@playwright/test';

test('Can load a bar chart and remove axis', async ({ page }) => {
  await page.goto('http://localhost:3000/app/home');
  await page.getByRole('link', { name: 'Metrics', exact: true }).click();

  await page
    .getByRole('link', {
      name: 'Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)'
    })
    .click();

  await expect(page.getByTestId('metric-view-chart-content')).toBeVisible();
  await expect(page.getByTestId('metric-view-chart-content').getByRole('img')).toBeVisible();

  //can remove x axis from bar chart
  await page.getByTestId('edit-chart-button').getByRole('button').click();
  await page.locator('.relative > button').first().click();
  await expect(page.getByText('No valid axis selected')).toBeVisible();

  //can drag a numeric column to x axis

  const sourceElement = page
    .getByTestId('select-axis-available-items-list')
    .getByRole('button')
    .first();
  expect(sourceElement).toBeVisible();

  const targetElement = page
    .getByTestId('select-axis-drop-zone-xAxis')
    .locator('div')
    .filter({ hasText: /^Drag column here$/ });
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

  await expect(
    page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button', { name: 'Year' })
  ).toBeVisible();

  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(2).click();
  await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.getByRole('button', { name: 'Reset' })).not.toBeVisible();
});

test('Can add a tooltip to a bar chart', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );

  const sourceElement = page
    .getByTestId('select-axis-available-items-list')
    .getByRole('button')
    .first();
  const targetElement = page
    .getByTestId('select-axis-drop-zone-tooltip')
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

  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(50);
  await page.waitForLoadState('networkidle');

  page.reload();

  await page
    .getByTestId('metric-view-chart-content')
    .getByRole('img')
    .hover({
      position: {
        x: 633,
        y: 43
      }
    });

  page.reload();

  await expect(
    page.getByTestId('select-axis-drop-zone-tooltip').getByRole('button', { name: 'Year' })
  ).toBeVisible();
  await page.getByTestId('select-axis-drop-zone-tooltip').getByRole('button').nth(2).click();
  await expect(
    page.getByTestId('select-axis-drop-zone-tooltip').getByText('Drag column here')
  ).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(50);
  await page.waitForLoadState('networkidle');
});

test('Can toggle legend', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('segmented-trigger-Styling').click();
  await page
    .locator('div')
    .filter({ hasText: /^Show legend$/ })
    .getByRole('switch')
    .click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(50);
  await page.waitForLoadState('networkidle');

  await page.reload();
  await page.getByTestId('segmented-trigger-Styling').click();

  await page
    .locator('div')
    .filter({ hasText: /^Show legend$/ })
    .getByRole('switch')
    .click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');
  await page
    .locator('div')
    .filter({ hasText: /^Data labels$/ })
    .getByRole('switch')
    .click();
  await page
    .locator('div')
    .filter({ hasText: /^Data labels$/ })
    .getByRole('switch')
    .click();
  await page
    .locator('div')
    .filter({ hasText: /^Grid lines$/ })
    .getByRole('switch')
    .click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(50);
  await page.waitForLoadState('networkidle');

  await page.reload();
  await page.getByTestId('segmented-trigger-Styling').click();
  await expect(page.locator('body')).toMatchAriaSnapshot(`
      - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
      - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
      - img
      `);
  await page
    .locator('div')
    .filter({ hasText: /^Grid lines$/ })
    .getByRole('switch')
    .click();
  await page
    .locator('div')
    .filter({ hasText: /^Hide y-axis$/ })
    .getByRole('switch')
    .click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');

  await page.reload();
  await page.getByTestId('segmented-trigger-Styling').click();

  await expect(page.locator('body')).toMatchAriaSnapshot(`
      - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
      - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
      - img
      `);
  await page
    .locator('div')
    .filter({ hasText: /^Hide y-axis$/ })
    .getByRole('switch')
    .click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');
});

test('Can toggle sorting', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('segmented-trigger-Styling').click();
  await page.getByTestId('segmented-trigger-asc').click();
  await expect(page.locator('body')).toMatchAriaSnapshot(`
      - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
      - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
      - img
      - img
      - text: Unsaved changes
      - button "Reset"
      - button "Save"
      `);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');

  await page.reload();
  await page.getByTestId('segmented-trigger-Styling').click();

  await page.getByTestId('segmented-trigger-desc').click();
  await expect(page.locator('body')).toMatchAriaSnapshot(`
      - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
      - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
      - img
      - img
      - text: Unsaved changes
      - button "Reset"
      - button "Save"
      `);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(50);
  await page.waitForLoadState('networkidle');

  await page.reload();
  await page.getByTestId('segmented-trigger-Styling').click();

  await page.getByTestId('segmented-trigger-none').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');
});

test('Can toggle legend headline', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('segmented-trigger-Styling').click();

  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Total' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');

  await page.reload();

  await page.getByTestId('segmented-trigger-Styling').click();
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'None' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');

  await expect(page.locator('body')).toMatchAriaSnapshot(`
      - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
      - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\? Total Sales Revenue/
      - img
      `);
});

test('Can add a goal line', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('segmented-trigger-Styling').click();

  await page.waitForTimeout(150);
  await page.getByRole('button', { name: 'Add goal line' }).click();

  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');

  await page.reload();
  await page.getByTestId('segmented-trigger-Styling').click();
  await expect(page.locator('body')).toMatchAriaSnapshot(`
      - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
      - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\? Total Sales Revenue/
      - img
      `);
  await page
    .getByRole('main')
    .filter({ hasText: 'Jan 1, 2022 - May 2, 2025•' })
    .getByRole('button')
    .nth(2)
    .click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(50);
  await page.waitForLoadState('networkidle');

  await page.reload();

  await expect(page.locator('body')).toMatchAriaSnapshot(`
      - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
      - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\? Total Sales Revenue/
      - img
      `);
});

test('Can add a trendline', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('segmented-trigger-Styling').click();
  await page.getByRole('button', { name: 'Add trend line' }).click();
  await page.getByRole('combobox').filter({ hasText: 'Linear' }).click();
  await page.getByRole('option', { name: 'Max' }).click();
  await page.getByRole('combobox').filter({ hasText: 'Max' }).click();
  await page.getByRole('option', { name: 'Median' }).click();
  await page.getByRole('combobox').filter({ hasText: 'Median' }).click();
  await page.getByRole('option', { name: 'Average' }).click();
  await page.getByRole('combobox').filter({ hasText: 'Average' }).click();
  await page.getByRole('option', { name: 'Linear' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(50);
  await page.waitForLoadState('networkidle');

  page.reload();

  await page.getByTestId('segmented-trigger-Styling').click();
  await page
    .locator('div')
    .filter({ hasText: /^Trend lineAdd trend lineLinear$/ })
    .getByRole('button')
    .nth(1)
    .click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(50);
  await page.waitForLoadState('networkidle');
});

test('Can change colors', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('segmented-trigger-Colors').click();
  await page
    .locator('div')
    .filter({ hasText: /^Forest Lake$/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
    - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\? Total Sales Revenue/
    - img
    `);

  await page.waitForTimeout(50);
  await page.waitForLoadState('networkidle');

  await page
    .locator('div')
    .filter({ hasText: /^Buster$/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(50);
  await page.waitForLoadState('networkidle');
});
