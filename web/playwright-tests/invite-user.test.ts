import { test, expect } from '@playwright/test';

test.describe
  .serial('invite user', () => {
    test('Invite User', async ({ page }) => {
      await page.goto('http://localhost:3000/app/home');
      await page
        .locator('div')
        .filter({ hasText: /^Invite people$/ })
        .first()
        .click();
      await page.getByRole('textbox', { name: 'buster@bluthbananas.com,' }).click();
      await page
        .getByRole('textbox', { name: 'buster@bluthbananas.com,' })
        .fill('nate+integration-test@buser.so');
      await page.getByRole('button', { name: 'Send invites' }).click();
      await page.waitForTimeout(100);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByText('Invites sent').first()).toBeVisible({ timeout: 3000 });

      await page.getByRole('button').filter({ hasText: /^$/ }).first().click();
      await page.getByRole('link', { name: 'Users' }).click();
      await page.waitForTimeout(250);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');
      await expect(page.getByRole('link', { name: 'nate+integration-test@buser.' })).toBeVisible({
        timeout: 20000
      });
      await expect(page.getByRole('main')).toMatchAriaSnapshot(`
    - img
    - text: nate+integration-test@buser.so Restricted Querier
    `);

      await page.getByRole('link', { name: 'nate+integration-test@buser.' }).click();
      await page.waitForTimeout(100);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByText('nate+integration-test@buser.so')).toBeVisible();
    });

    test('Can change user role', async ({ page }) => {
      await page.goto('http://localhost:3000/app/settings/users');
      await page.getByRole('link', { name: 'B blake blake@buster.so' }).click();
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByText('blake@buster.so')).toBeVisible();
      await expect(page.getByRole('combobox')).toHaveText(/Querier/);
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Workspace Admin' }).click();
      await expect(
        page.locator('.text-text-secondary > div:nth-child(2) > .text-text-secondary').first()
      ).toBeVisible();
      await page.waitForTimeout(25);
      await page.waitForLoadState('networkidle');
      await page.reload();
      await expect(
        page.locator('.text-text-secondary > div:nth-child(2) > .text-text-secondary').first()
      ).toBeVisible();
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Querier', exact: true }).click();
      await expect(
        page.locator('.text-text-secondary > div:nth-child(2) > .text-text-secondary').first()
      ).toBeVisible();
      await page.waitForTimeout(15);
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
    });
  });
