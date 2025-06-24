import { initLogger } from 'braintrust';
import { afterAll, beforeAll, describe } from 'vitest';

describe('Post-Processing Workflow Integration Tests', () => {
  beforeAll(() => {
    initLogger({
      apiKey: process.env.BRAINTRUST_KEY,
      projectName: process.env.ENVIRONMENT,
    });
  });

  afterAll(async () => {
    // Allow time for cleanup operations
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });
});
