import { randomUUID } from 'node:crypto';
import { getSandboxFileTree } from '@buster/sandbox/filesystem/file-tree/get-file-tree';
import { createSandboxWithRepositories } from '@buster/sandbox/management/create-sandbox-with-repositories';
import type { ModelMessage } from 'ai';
import { initLogger } from 'braintrust';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runDocsAgentWorkflow } from './docs-agent-workflow';

describe('docs-agent-workflow integration', () => {
  let hasRequiredEnvVars: boolean;

  beforeAll(() => {
    // Initialize Braintrust logger if available
    if (process.env.BRAINTRUST_KEY) {
      initLogger({
        apiKey: process.env.BRAINTRUST_KEY,
        projectName: process.env.ENVIRONMENT || 'test',
      });
    }

    // Check if required environment variables are present
    hasRequiredEnvVars = Boolean(
      process.env.TEST_GITHUB_PAT && process.env.TEST_SAMPLE_REPO && process.env.DAYTONA_API_KEY
    );

    if (!hasRequiredEnvVars) {
      console.info(
        'Skipping integration test - TEST_GITHUB_PAT, TEST_SAMPLE_REPO, or DAYTONA_API_KEY not set'
      );
    }
  });

  afterAll(async () => {
    // Allow time for cleanup operations
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  it('should create sandbox, get file tree, and run docs workflow', async () => {
    if (!hasRequiredEnvVars) {
      console.info('Skipping test due to missing environment variables');
      return;
    }

    // Create branch name with unix timestamp
    const branchName = `test-${Date.now()}`;

    // Create sandbox with repository
    const sandbox = await createSandboxWithRepositories({
      language: 'typescript',
      repositories: [process.env.TEST_SAMPLE_REPO!],
      githubToken: process.env.TEST_GITHUB_PAT!,
      branchName: branchName,
    });

    // Get file tree from sandbox
    const fileTree = await getSandboxFileTree(sandbox);
    console.info('File tree retrieved successfully');

    // Prepare workflow input
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content:
          'Please add thorough documentation for the guild memberships and add a filter for active campaign as a campaign that has a report in the last 6 months please',
      },
    ];

    const workflowInput = {
      messages,
      messageId: randomUUID(),
      chatId: randomUUID(),
      userId: randomUUID(),
      organizationId: randomUUID(),
      dataSourceId: randomUUID(),
      sandbox,
    };

    // Run the docs agent workflow
    const result = await runDocsAgentWorkflow(workflowInput);

    // Validate the workflow output
    expect(result).toBeDefined();
    expect(result.workflowId).toBeDefined();
    expect(result.chatId).toBe(workflowInput.chatId);
    expect(result.messageId).toBe(workflowInput.messageId);
    expect(result.userId).toBe(workflowInput.userId);
    expect(result.organizationId).toBe(workflowInput.organizationId);
    expect(result.dataSourceId).toBe(workflowInput.dataSourceId);

    // Check execution metrics
    expect(result.totalExecutionTimeMs).toBeGreaterThan(0);
    expect(result.startTime).toBeLessThanOrEqual(result.endTime);

    // Check workflow outputs
    expect(result.messages).toBeDefined();
    expect(result.messages.length).toBeGreaterThan(0);
    expect(result.repositoryTree).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(result.todos).toContain('- [ ]'); // Should contain checkbox items

    // Check summary
    expect(result.summary).toBeDefined();

    console.info('Workflow completed successfully');
    console.info('Workflow execution time:', result.totalExecutionTimeMs, 'ms');
    console.info('Repository tree length:', result.repositoryTree?.length || 0, 'characters');
    console.info(
      'TODOs created:',
      result.todos?.split('\n').filter((line) => line.includes('- [ ]')).length || 0,
      'items'
    );

    // Clean up - stop the sandbox
    await sandbox.stop();
  }, 900000); // 15 minute timeout for full workflow
});
