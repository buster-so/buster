import { test, expect } from '@playwright/test';

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
  await page.waitForLoadState('networkidle');
  expect(page.getByRole('textbox', { name: 'THIS IS A TEST!' })).toBeVisible();

  await page.reload();
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
  await page.getByRole('textbox', { name: 'THIS IS A TEST!' }).click();
  await page.getByRole('textbox', { name: 'THIS IS A TEST!' }).fill('Total Sales Revenue');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');

  await page.reload();
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
  await expect(page.getByRole('textbox', { name: 'Total Sales Revenue' })).toBeVisible();
});

test('Y axis config - Label style', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
  await page.getByTestId('segmented-trigger-percent').click();
  await expect(page.getByText('Unsaved changes')).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');

  await page.reload();

  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
  expect(page.getByTestId('segmented-trigger-percent')).toHaveAttribute('data-state', 'active');

  await page.getByTestId('segmented-trigger-number').click();

  await expect(page.getByText('Unsaved changes')).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');
});

test('Y axis config - Label seperator style', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
  await page.getByTestId('edit-separator-input').getByRole('combobox').click();
  expect(page.getByRole('option', { name: '100000' })).toBeVisible();
  await page.getByRole('option', { name: '100000' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');
  await page.getByTestId('edit-separator-input').getByRole('combobox').click();
  await page.getByRole('option', { name: '100,000' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');

  await page.reload();
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
  expect(page.getByText('100,000')).toBeVisible();
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
  await page.waitForLoadState('networkidle');

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
    .fill('8');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');
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
  await page.getByRole('switch').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
    - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
    - img
    `);
  await page
    .locator('div')
    .filter({ hasText: /^Show label as %$/ })
    .getByRole('switch')
    .click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');

  await page.reload();
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
    - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
    - img
    `);
  await page
    .locator('div')
    .filter({ hasText: /^Show label as %$/ })
    .getByRole('switch')
    .click();
  await page
    .locator('div')
    .filter({ hasText: /^Show data labels$/ })
    .getByRole('switch')
    .click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');

  await page.reload();
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
    - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
    - img
    `);
});

test('Y axis config - global settings', async ({ page }) => {
  await page.goto(
    'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
  );
  await page
    .locator('div')
    .filter({ hasText: /^Y-Axis$/ })
    .getByRole('button')
    .click();
  await page
    .locator('div')
    .filter({ hasText: /^Show axis title$/ })
    .getByRole('switch')
    .click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
    - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
    - img
    `);

  await page.reload();

  await page
    .locator('div')
    .filter({ hasText: /^Y-Axis$/ })
    .getByRole('button')
    .click();
  await page
    .locator('div')
    .filter({ hasText: /^Show axis title$/ })
    .getByRole('switch')
    .click();

  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
    - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
    - img
    `);

  await page.reload();

  await page
    .locator('div')
    .filter({ hasText: /^Y-Axis$/ })
    .getByRole('button')
    .click();
  await page
    .locator('div')
    .filter({ hasText: /^Show axis label$/ })
    .getByRole('switch')
    .click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
    - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
    - img
    `);

  await page.reload();

  await page
    .locator('div')
    .filter({ hasText: /^Y-Axis$/ })
    .getByRole('button')
    .click();
  await page
    .locator('div')
    .filter({ hasText: /^Show axis label$/ })
    .getByRole('switch')
    .click();
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Logarithmic' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
    - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
    - img
    `);
  await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(3).click();
  await page
    .locator('div')
    .filter({ hasText: /^Y-Axis$/ })
    .getByRole('button')
    .click();
  await page.getByRole('combobox').filter({ hasText: 'Logarithmic' }).click();
  await page.getByRole('option', { name: 'Linear' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('networkidle');
});
