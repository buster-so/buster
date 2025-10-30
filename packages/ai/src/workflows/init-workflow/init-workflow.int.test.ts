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
    const sampleDbtRepoPath = '{repo/path}';
    process.chdir(sampleDbtRepoPath);

    // Create test input with valid UUIDs
    const input: InitWorkflowInput = {
      chatId: randomUUID(),
      messageId: randomUUID(),
      userId: '07a4de7f-d624-48ca-94e3-211dadebbcd1',
      organizationId: '8d2f318c-ba9e-4cb6-b3f8-e26dcf5398ba',
      dataSourceId: '1cc380df-710c-4cbc-b8a6-cc8fc47ef1dc',
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
