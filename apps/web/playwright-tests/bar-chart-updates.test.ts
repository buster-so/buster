import { expect, test } from '@playwright/test';

test.describe('Bar chart - add to tests', () => {
  test('Can add to collection', async ({ page }) => {
    await page.goto('http://localhost:3000/app/metrics/2b569e92-229b-5cad-b312-b09c751c544d/chart');
    await page.getByTestId('add-to-collection-button').click();
    await page.waitForLoadState('networkidle');
    await expect(
      page
        .getByTestId('dropdown-checkbox-0ac43ae2-beda-4007-9574-71a17425da0a')
        .getByRole('checkbox')
    ).toBeVisible();

    await expect(
      page
        .getByTestId('dropdown-checkbox-0ac43ae2-beda-4007-9574-71a17425da0a')
        .getByRole('checkbox')
    ).toHaveAttribute('data-state', 'unchecked');
    await page
      .getByTestId('dropdown-checkbox-0ac43ae2-beda-4007-9574-71a17425da0a')
      .getByRole('checkbox')
      .click();
    await page.waitForLoadState('networkidle');
    await expect(
      page
        .getByTestId('dropdown-checkbox-0ac43ae2-beda-4007-9574-71a17425da0a')
        .getByRole('checkbox')
    ).toBeVisible();
    await expect(
      page
        .getByTestId('dropdown-checkbox-0ac43ae2-beda-4007-9574-71a17425da0a')
        .getByRole('checkbox')
    ).toHaveAttribute('data-state', 'checked');
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');
    await page.reload();
    await page.getByTestId('add-to-collection-button').click();
    await page.waitForLoadState('networkidle');
    await expect(
      page
        .getByTestId('dropdown-checkbox-0ac43ae2-beda-4007-9574-71a17425da0a')
        .getByRole('checkbox')
    ).toHaveAttribute('data-state', 'checked');
    await page
      .getByTestId('dropdown-checkbox-0ac43ae2-beda-4007-9574-71a17425da0a')
      .getByRole('checkbox')
      .click();
    await page.waitForLoadState('networkidle');
    await expect(
      page
        .getByTestId('dropdown-checkbox-0ac43ae2-beda-4007-9574-71a17425da0a')
        .getByRole('checkbox')
    ).toHaveAttribute('data-state', 'unchecked');
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');
  });

  test('Can navigate to collections page', async ({ page }) => {
    await page.goto('http://localhost:3000/app/metrics/2b569e92-229b-5cad-b312-b09c751c544d/chart');
    await page.getByTestId('add-to-collection-button').click();
    const currentUrl = page.url();

    await page
      .getByRole('menuitemcheckbox', { name: 'Important Things' })
      .getByRole('link')
      .click();
    await page.goto('http://localhost:3000/app/collections/0ac43ae2-beda-4007-9574-71a17425da0a');
    expect(page.url()).not.toBe(currentUrl);
  });

  test.skip('Add to dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/app/metrics/2b569e92-229b-5cad-b312-b09c751c544d/chart');
    await page.getByTestId('save-to-dashboard-button').click();
    await page.getByText('Important Metrics').click();
    await expect(
      page.getByRole('menuitemcheckbox', { name: 'Important Metrics' }).getByRole('checkbox')
    ).toBeVisible();

    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');
    await page.reload();

    await page.getByTestId('save-to-dashboard-button').click();
    await page
      .getByRole('menuitemcheckbox', { name: 'Important Metrics' })
      .getByRole('button')
      .click();
    await expect(page.getByRole('button', { name: 'Yearly Sales Revenue -' })).toBeVisible();
    await page
      .locator(
        'div:nth-child(4) > .buster-resize-columns > .react-split > .react-split__pane > div > div:nth-child(2) > .bg-background > div'
      )
      .first()
      .click();
    await expect(page.getByRole('button', { name: 'Start chat' })).toBeVisible();
    await page.getByTestId('save-to-dashboard-button').click();
    await page
      .getByRole('menuitemcheckbox', { name: 'Important Metrics' })
      .getByRole('checkbox')
      .click();
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByTestId('share-button')).toBeVisible();
    await expect(page.getByTestId('three-dot-menu-button')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start chat' })).toBeVisible();
  });
});

test.describe('Bar chart styling updates', () => {
  test('Can load a bar chart and remove axis', async ({ page }) => {
    await page.goto('http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee');
    await page.waitForTimeout(50);
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load');

    await expect(page.getByTestId('metric-view-chart-content')).toBeVisible();
    await expect(page.getByTestId('metric-view-chart-content').getByRole('img')).toBeVisible();

    //can remove x axis from bar chart
    await page.getByTestId('edit-chart-button').getByRole('button').click();

    await page.getByTestId('select-axis-drop-zone-xAxis').getByTestId('delete-button').click();
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
      page.getByTestId('select-axis-drop-zone-xAxis').locator('button').filter({ hasText: 'Year' })
    ).toBeVisible();

    await page.getByTestId('select-axis-drop-zone-xAxis').getByTestId('delete-button').click();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.getByRole('button', { name: 'Reset' })).not.toBeVisible();
  });

  test('Can add a tooltip to a bar chart', async ({ page }) => {
    await page.goto(
      'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
    );
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load');

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
        await page.waitForTimeout(2); // Add a small delay between each movement
      }

      await page.mouse.up();
    }

    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(250);
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load');

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
      page
        .getByTestId('select-axis-drop-zone-tooltip')
        .locator('button')
        .filter({ hasText: 'Year' })
    ).toBeVisible();
    await page.getByTestId('select-axis-drop-zone-tooltip').getByTestId('delete-button').click();
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
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load');
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
    await page.waitForTimeout(100);
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
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load');
    await page.getByTestId('segmented-trigger-Styling').click();
    await page.getByTestId('segmented-trigger-asc').click();

    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();

    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForLoadState('networkidle');

    await page.reload();
    await page.getByTestId('segmented-trigger-Styling').click();

    await page.getByTestId('segmented-trigger-desc').click();
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(50);
    await page.waitForLoadState('networkidle');

    await page.reload();
    await page.getByTestId('segmented-trigger-Styling').click();

    await page.getByTestId('segmented-trigger-none').click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');
  });

  test('Can toggle legend headline', async ({ page }) => {
    await page.goto(
      'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
    );
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load');
    await page.getByTestId('segmented-trigger-Styling').click();

    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Total' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');

    await page.reload();

    await page.getByTestId('segmented-trigger-Styling').click();
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'None' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');
  });

  test('Can add a goal line', async ({ page }) => {
    await page.goto(
      'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
    );
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load');
    await page.getByTestId('segmented-trigger-Styling').click();

    await page.waitForTimeout(25);
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load');
    await page.getByRole('button', { name: 'Add goal line' }).click();

    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');

    await page.reload();
    await page.getByTestId('segmented-trigger-Styling').click();
    await page.waitForTimeout(25);
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load');
    await page.getByTestId('delete-button').click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(50);
    await page.waitForLoadState('networkidle');

    await page.reload();
    await page.getByTestId('segmented-trigger-Styling').click();
    await page.waitForTimeout(25);
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load');
    await expect(page.getByTestId('delete-button')).not.toBeVisible();
  });

  test('Can add a trendline', async ({ page }) => {
    await page.goto(
      'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
    );
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load');
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
    await page.waitForTimeout(90);
    await page.waitForLoadState('networkidle');
    await page.goto(
      'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
    );
    page.reload();

    await page.getByTestId('segmented-trigger-Styling').click();
    await page.waitForTimeout(50);
    await expect(page.getByTestId('trendline-Linear').locator('div').nth(1)).toBeVisible();
    await page.getByText('Styling').click();
    await page.getByTestId('trendline-Linear').locator('div').nth(1).hover();
    await page.getByTestId('delete-button').click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(50);
    await page.waitForLoadState('networkidle');
  });

  test('Can change colors', async ({ page }) => {
    await page.goto(
      'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
    );
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load');
    await page.getByTestId('segmented-trigger-Colors').click();
    await page
      .locator('div')
      .filter({ hasText: /^Forest Lake$/ })
      .first()
      .click();
    expect(page.getByTestId('color-theme-Forest Lake')).toHaveAttribute('data-selected', 'true');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(250);
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load');
    expect(page.getByTestId('color-theme-Forest Lake')).toHaveAttribute('data-selected', 'true');

    await page
      .locator('div')
      .filter({ hasText: /^Buster$/ })
      .first()
      .click();

    expect(page.getByTestId('color-theme-Buster')).toHaveAttribute('data-selected', 'true');

    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(50);
    await page.waitForLoadState('networkidle');
  });
});

test.describe('Bar chart - x axis updates', () => {
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
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('load');
    await page
      .getByTestId('select-axis-drop-zone-xAxis')
      .getByTestId('select-axis-drop-zone-sale_year')
      .click();

    await page.getByRole('textbox', { name: 'Year' }).click();
    await page.getByRole('textbox', { name: 'Year' }).fill('WOOHOO!');
    await expect(page.getByTestId('select-axis-drop-zone-xAxis')).toContainText('WOOHOO!');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');

    await page.reload();
    await expect(page.getByTestId('select-axis-drop-zone-xAxis')).toContainText('WOOHOO!');
    await page
      .getByTestId('select-axis-drop-zone-sale_year')
      .getByTestId('toggle-dropdown-button')
      .click();

    await page.getByRole('textbox', { name: 'WOOHOO!' }).click();
    await page.getByRole('textbox', { name: 'WOOHOO!' }).fill('Year');
    await page.waitForTimeout(100);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);
    await page.reload();
    await expect(page.getByTestId('select-axis-drop-zone-xAxis')).not.toContainText('WOOHOO!');
  });
});

test.describe('Bar chart - y axis updates', () => {
  test('Y axis config - Title', async ({ page }) => {
    await page.goto(
      'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
    );
    await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(1).click();
    await page.getByRole('textbox', { name: 'Total Sales Revenue' }).click();
    await page.getByRole('textbox', { name: 'Total Sales Revenue' }).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'Total Sales Revenue' }).fill('THIS IS A TEST!');
    await expect(
      page
        .getByTestId('select-axis-drop-zone-yAxis')
        .locator('button')
        .filter({ hasText: 'THIS IS A TEST!' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');
    expect(page.getByRole('textbox', { name: 'THIS IS A TEST!' })).toBeVisible();

    await page.reload();
    await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(1).click();
    await page.getByRole('textbox', { name: 'THIS IS A TEST!' }).click();
    await page.getByRole('textbox', { name: 'THIS IS A TEST!' }).fill('Total Sales Revenue');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');

    await page.reload();
    await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(1).click();
    await expect(page.getByRole('textbox', { name: 'Total Sales Revenue' })).toBeVisible();
  });

  test('Y axis config - Label style', async ({ page }) => {
    await page.goto(
      'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
    );
    await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(1).click();
    await page.getByTestId('segmented-trigger-percent').click();
    await expect(page.getByText('Unsaved changes')).toBeVisible();
    await page.waitForTimeout(100);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');

    await page.reload();

    await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(1).click();
    expect(page.getByTestId('segmented-trigger-percent')).toHaveAttribute('data-state', 'active');

    await page.getByTestId('segmented-trigger-number').click();

    await expect(page.getByText('Unsaved changes')).toBeVisible();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');
  });

  test('Y axis config - Label seperator style', async ({ page }) => {
    await page.goto(
      'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
    );
    await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(1).click();
    await page.getByTestId('edit-separator-input').getByRole('combobox').click();
    expect(page.getByRole('option', { name: '100000' })).toBeVisible();
    await page.getByRole('option', { name: '100000' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');
    await page.getByTestId('edit-separator-input').getByRole('combobox').click();
    await page.getByRole('option', { name: '100,000' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');

    await page.reload();
    await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(1).click();
    expect(page.getByText('100,000')).toBeVisible();
  });

  test('Y axis config - adjust bar roundness', async ({ page }) => {
    await page.goto(
      'http://localhost:3000/app/metrics/45c17750-2b61-5683-ba8d-ff6c6fefacee/chart?secondary_view=chart-edit'
    );
    await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(1).click();
    await page.getByRole('slider').click();
    await page
      .locator('div')
      .filter({ hasText: /^Bar roundness$/ })
      .getByRole('spinbutton')
      .fill('25');
    await page.getByRole('textbox', { name: 'Total Sales Revenue' }).click();
    await page
      .locator('div')
      .filter({ hasText: /^TitleBar roundnessShow data labels$/ })
      .getByRole('spinbutton')
      .click();
    await page
      .locator('div')
      .filter({ hasText: /^TitleBar roundnessShow data labels$/ })
      .getByRole('spinbutton')
      .fill('26');
    await page
      .locator('div')
      .filter({ hasText: /^TitleBar roundnessShow data labels$/ })
      .getByRole('spinbutton')
      .press('Enter');
    await expect(
      page
        .locator('div')
        .filter({ hasText: /^Bar roundness$/ })
        .getByRole('spinbutton')
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();

    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');

    await page.reload();
    await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(1).click();

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
    await page.waitForTimeout(100);
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

    await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(1).click();
    await page.getByRole('switch').click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
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
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');

    await page.reload();
    await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(1).click();

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
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');

    await page.reload();
    await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(1).click();

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
    await page.waitForTimeout(100);
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
    await page.waitForTimeout(100);
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
    await page.waitForTimeout(100);
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
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toMatchAriaSnapshot(`
        - textbox "New chart": Yearly Sales Revenue - Signature Cycles Products (Last 3 Years + YTD)
        - text: /Jan 1, \\d+ - May 2, \\d+ • What is the total yearly sales revenue for products supplied by Signature Cycles from \\d+ to present\\?/
        - img
        `);
    await page.getByTestId('select-axis-drop-zone-yAxis').getByRole('button').nth(1).click();
    await page
      .locator('div')
      .filter({ hasText: /^Y-Axis$/ })
      .getByRole('button')
      .click();
    await page.getByRole('combobox').filter({ hasText: 'Logarithmic' }).click();
    await page.getByRole('option', { name: 'Linear' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(100);
    await page.waitForLoadState('networkidle');
  });
});
