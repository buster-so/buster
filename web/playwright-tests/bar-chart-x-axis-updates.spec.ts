import { test, expect } from '@playwright/test';

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
  await page.getByRole('textbox', { name: 'Year' }).fill('WOOHOO!');
  await expect(page.getByTestId('select-axis-drop-zone-xAxis')).toContainText('WOOHOO!');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');

  await page.reload();
  await expect(page.getByTestId('select-axis-drop-zone-xAxis')).toContainText('WOOHOO!');
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByRole('textbox', { name: 'WOOHOO!' }).click();
  await page.getByRole('textbox', { name: 'WOOHOO!' }).fill('Year');
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(100);
  await page.reload();
  await expect(page.getByTestId('select-axis-drop-zone-xAxis')).not.toContainText('WOOHOO!');
});

test('X axis config - we can edit the label style', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );

  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByTestId('segmented-trigger-percent').click();
  await expect(page.getByText('Unsaved changes')).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(100);
  await page.waitForLoadState('networkidle');
  await page.reload();
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByTestId('segmented-trigger-number').click();
  await expect(page.getByText('Unsaved changes')).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(100);
  await page.waitForLoadState('networkidle');
  await page.reload();
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  expect(page.getByTestId('segmented-trigger-number')).toHaveAttribute('data-state', 'active');
});

test('X axis config - We can edit the label separator style', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: '100,000' }).click();
  await page.getByRole('button', { name: 'Save' }).click();

  await page.waitForTimeout(10);
  await page.waitForLoadState('networkidle');

  await expect(page.locator('body')).toMatchAriaSnapshot(`
      - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
      - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
      - img
      `);
  await page.waitForTimeout(20);
  await page.waitForLoadState('networkidle');

  await page.reload();
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: '100000' }).click();
  await page.getByRole('button', { name: 'Save' }).click();

  await page.waitForLoadState('networkidle');
  await page.reload();
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();

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
  await page.getByRole('spinbutton').first().fill('2');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');

  await page.reload();
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  expect(page.getByRole('spinbutton').first()).toHaveValue('2');

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
  await page.waitForLoadState('networkidle');

  await page.reload();
  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  expect(page.getByPlaceholder('1')).toHaveValue('10');
  await page.getByPlaceholder('1').click();
  await page.getByPlaceholder('1').fill('1');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');
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
  await page.waitForLoadState('networkidle');
  await page.getByRole('textbox', { name: 'dollars' }).click();
  await page.getByRole('textbox', { name: 'dollars' }).fill('SWAG2');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toMatchAriaSnapshot(`
      - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
      - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
      - img
      `);

  await page.reload();

  await page.getByTestId('select-axis-drop-zone-xAxis').getByRole('button').nth(3).click();
  await page.getByRole('textbox', { name: '$' }).click();
  await page.getByRole('textbox', { name: '$' }).fill('');
  await page.getByRole('textbox', { name: 'dollars' }).click();
  await page.getByRole('textbox', { name: 'dollars' }).fill('');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');
});
