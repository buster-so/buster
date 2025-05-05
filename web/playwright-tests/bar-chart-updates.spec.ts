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
    const steps = 50;
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

test('X axis config - Title', async ({ page }) => {
  await page.goto('http://localhost:3000/app/home');
  await page.getByRole('link', { name: 'Metrics', exact: true }).click();

  await page
    .getByRole('link', {
      name: 'Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)'
    })
    .click();

  await expect(page.getByTestId('metric-view-chart-content')).toBeVisible();
  await expect(page.getByTestId('metric-view-chart-content').getByRole('img')).toBeVisible();

  //#1 TEST WE CAN EDIT THE TITLE
  await page.getByTestId('edit-chart-button').getByRole('button').click();
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByRole('textbox', { name: 'Year' }).click();
  await page.getByRole('textbox', { name: 'Year' }).fill('Year WOOHOO!');
  await expect(page.getByTestId('select-axis-drop-zone-xAxis')).toContainText('Year WOOHOO!');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.reload();
  await expect(page.getByTestId('select-axis-drop-zone-xAxis')).toContainText('Year WOOHOO!');
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByRole('textbox', { name: 'Year' }).click();
  await page.getByRole('textbox', { name: 'Year' }).fill('Year');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.reload();
  await expect(page.getByTestId('select-axis-drop-zone-xAxis')).toContainText('Year');
  await expect(page.getByTestId('select-axis-drop-zone-xAxis')).not.toContainText('Year WOOHOO!');
});

test('X axis config - we can edit the label style', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );

  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByTestId('segmented-trigger-percent').click();
  await expect(page.getByText('Unsaved changes')).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();

  await page.reload();
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByTestId('segmented-trigger-number').click();
  await expect(page.getByText('Unsaved changes')).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
});

test('X axis config - We can edit the label style', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByTestId('segmented-trigger-percent').click();
  await expect(page.getByText('Unsaved changes')).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.reload();
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByTestId('segmented-trigger-number').click();
  await expect(page.getByText('Unsaved changes')).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.reload();
});

test('X axis config - We can edit the label seperator style', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: '100,000' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
    - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
    - img
    `);

  await page.reload();
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: '100000' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
    - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
    - img
    `);
});

test('X axis config - We can edit the decimal places', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByRole('spinbutton').first().click();
  await page.getByRole('spinbutton').first().fill('02');
  await page.getByRole('button', { name: 'Save' }).click();

  page.reload();
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
    - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
    - img
    `);
  await page.getByRole('spinbutton').first().click();
  await page.getByRole('spinbutton').first().fill('0');
  await page.getByRole('button', { name: 'Save' }).click();
});

test('X axis config - We can edit the multiply by places', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByPlaceholder('1').click();
  await page.getByPlaceholder('1').fill('10');
  await page.getByRole('button', { name: 'Save' }).click();

  page.reload();
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByPlaceholder('1').click();
  await page.getByPlaceholder('1').fill('1');
  await page.getByRole('button', { name: 'Save' }).click();
});

test('X axis config - We can edit the prefix', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByRole('textbox', { name: '$' }).click();
  await page.getByRole('textbox', { name: '$' }).fill('SWAG');
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
  await page.getByRole('textbox', { name: 'dollars' }).click();
  await page.getByRole('textbox', { name: 'dollars' }).fill('SWAG2');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
    - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
    - img
    `);

  page.reload();

  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByRole('textbox', { name: '$' }).click();
  await page.getByRole('textbox', { name: '$' }).fill('');
  await page.getByRole('textbox', { name: 'dollars' }).click();
  await page.getByRole('textbox', { name: 'dollars' }).fill('');
  await page.getByRole('button', { name: 'Save' }).click();
});

test('Y axis config - Title', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
  await page.getByRole('textbox', { name: 'Total Sales Revenue' }).click();
  await page.getByRole('textbox', { name: 'Total Sales Revenue' }).press('ControlOrMeta+a');
  await page.getByRole('textbox', { name: 'Total Sales Revenue' }).fill('THIS IS A TEST!');
  await expect(page.getByRole('button', { name: 'THIS IS A TEST!' })).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();

  page.reload();
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
  await page.getByRole('textbox', { name: 'THIS IS A TEST!' }).click();
  await page.getByRole('textbox', { name: 'THIS IS A TEST!' }).fill('Total Sales Revenue');
  await page.getByRole('button', { name: 'Save' }).click();
});

test('Y axis config - Label style', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
  await page.getByTestId('segmented-trigger-percent').click();
  await expect(page.getByText('Unsaved changes')).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.reload();

  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
  await page.getByTestId('segmented-trigger-number').click();
  await expect(page.getByText('Unsaved changes')).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
});

test('Y axis config - Label seperator style', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
  await page.getByTestId('edit-separator-input').getByRole('combobox').click();
  await page.getByRole('option', { name: '100000' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByTestId('edit-separator-input').getByRole('combobox').click();
  await page.getByText('100,000').click();
  await page.getByRole('button', { name: 'Save' }).click();

  page.reload();
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
  expect(page.getByText('100,000')).toBeVisible();
});

test('Y axis config - Decimal places', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
  await page.getByRole('combobox').filter({ hasText: 'Zero' }).click();
  await page.getByRole('option', { name: 'Do not replace' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  page.reload();
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
  expect(page.getByText('Do not replace')).toBeVisible();
  await page.getByRole('combobox').filter({ hasText: 'Do not replace' }).click();
  await page.getByRole('option', { name: 'Zero' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
});

test('Y axis config - adjust bar roundness', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
  await page.getByRole('slider').click();
  await page
    .locator('div')
    .filter({ hasText: /^Bar roundness$/ })
    .getByRole('spinbutton')
    .fill('25');
  await expect(
    page
      .locator('div')
      .filter({ hasText: /^Bar roundness$/ })
      .getByRole('spinbutton')
  ).toBeVisible();
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

  await page.reload();
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();

  await page
    .locator('div')
    .filter({ hasText: /^Bar roundness$/ })
    .getByRole('spinbutton')
    .click();
  await page
    .locator('div')
    .filter({ hasText: /^Bar roundness$/ })
    .getByRole('spinbutton')
    .fill('08');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
    - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
    - img
    `);
  //
});

test('Y axis config - show data labels', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
  //
  await page.getByRole('switch').click();
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
});
