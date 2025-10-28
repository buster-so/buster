import { randomUUID } from 'node:crypto';
import { initLogger } from 'braintrust';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { runInitWorkflow } from './init-workflow';
import type { InitWorkflowInput } from './types';

describe('init-workflow integration', () => {
  let originalCwd: string;

  beforeAll(() => {
    // Initialize Braintrust logger
    initLogger({
      apiKey: process.env.BRAINTRUST_KEY,
      projectName: process.env.ENVIRONMENT,
    });
  });

  beforeEach(() => {
    // Store original working directory
    originalCwd = process.cwd();
  });

  afterEach(() => {
    // Always restore original directory
    process.chdir(originalCwd);
  });

  afterAll(async () => {
    // Allow time for cleanup operations
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });

  it('should discover dbt models and process them from sample repo', async () => {
    // Change to the sample dbt repo directory
    const sampleDbtRepoPath = '/Users/dallin/buster/adventure-works';
    process.chdir(sampleDbtRepoPath);

    // Create test input with valid UUIDs
    const input: InitWorkflowInput = {
      chatId: randomUUID(),
      messageId: randomUUID(),
      userId: 'c2dd64cd-f7f3-4884-bc91-d46ae431901e',
      organizationId: 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce',
      dataSourceId: 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
    };

    // Execute the init workflow
    // This will:
    // 1. Create AGENTS.md file
    // 2. Find all dbt_project.yml files
    // 3. Extract model-paths from each
    // 4. Walk model directories and find .sql files
    // 5. Process each model with the analytics engineer agent (real AI calls!)
    await runInitWorkflow(input);

    // If we got here without throwing, the workflow completed successfully
    expect(true).toBe(true);

    console.log('✓ Init workflow completed successfully');
    console.log('✓ Check Braintrust for detailed execution traces');
  }, 1800000); // 30 minute timeout for real AI processing
});
