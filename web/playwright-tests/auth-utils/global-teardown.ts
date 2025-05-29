import type { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  // Add any cleanup operations here if needed
  // For example, you might want to perform some API calls to reset test data
}

export default globalTeardown;
