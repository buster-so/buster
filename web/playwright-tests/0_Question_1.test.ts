import { test, expect } from '@playwright/test';
import { askQuestion, checkThatPageWasRedirected } from './question-helpers/ask-question';

test.skip('Question: Who is my top customer?', async ({ page }) => {
  await askQuestion(page, 'Who is my top customer?');

  await checkThatPageWasRedirected(page, ['reasoning', 'metrics']);

  // Optional: Check specific metrics route format without checking IDs
  expect(page.url()).toMatch(/\/app\/chats\/[^/]+\/metrics\/[^/]+\/chart/);

  // Check that the input field is empty
  await expect(page.getByRole('textbox', { name: 'Ask Buster a question...' })).toHaveValue('');

  await page.getByRole('tab', { name: 'Results' }).click();
  await page.waitForURL((url) => url.toString().includes('results'));
  expect(page.url()).toContain('results');

  await page.getByRole('tab', { name: 'File' }).click();
  await page.waitForURL((url) => url.toString().includes('file'));
  expect(page.url()).toContain('file');

  await page.getByRole('tab', { name: 'Chart' }).click();
  await page.waitForURL((url) => url.toString().includes('chart'));
  expect(page.url()).toContain('chart');

  await page.locator('a[aria-label="Reasoning link"]').click();
  await page.waitForURL((url) => url.toString().includes('reasoning'));
  expect(page.url()).toContain('reasoning');

  await page.click('[aria-label="Collapse file button"]');
  // Wait for and check redirection to chat page after collapsing file
  await page.waitForURL((url) => {
    // URL should be in format /app/chats/{id} without any additional segments
    return url.pathname.match(/^\/app\/chats\/[^/]+$/) !== null;
  });

  // Verify we're on the main chat page without any file/reasoning/metrics segments
  expect(page.url()).toMatch(/\/app\/chats\/[^/]+$/);
  expect(page.url()).not.toContain('reasoning');
  expect(page.url()).not.toContain('metrics');
  expect(page.url()).not.toContain('file');
  expect(page.url()).not.toContain('chart');

  // Verify at least one chat response message file element exists
  const fileElements = page.locator('[data-testid="chat-response-message-file"]');
  await expect(fileElements.first()).toBeVisible();

  // Click the last matching element
  const count = await fileElements.count();
  expect(count).toBeGreaterThan(0);
  await fileElements.nth(count - 1).click();

  await page.waitForURL((url) => url.toString().includes('chart'));
  expect(page.url()).toContain('chart');

  await expect(page.getByTestId('metric-view-chart-content')).toBeVisible();
});
