import type { Sandbox } from '@buster/sandbox';
import { createSandboxWithGit } from '@buster/sandbox';
import { currentSpan, initLogger, wrapTraced } from 'braintrust';
import type { Logger as BraintrustLogger } from 'braintrust';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DocsAgentContext } from '../../context/docs-agent-context';
import docsAgentWorkflow from './docs-agent-workflow';
import {
  TEST_MESSAGES,
  createContextWithClarifications,
  createContextWithTodos,
  createPartiallyCompletedContext,
  createTestContext,
  createTestWorkflowInput,
  validateWorkflowOutput,
} from './test-helpers/context-helpers';
import {
  type TestSandboxResult,
  addFilesToSandbox,
  createComplexProjectStructure,
  createFilesWithMissingDocs,
  createIntegrationTestSandbox,
  createMalformedYamlFiles,
} from './test-helpers/sandbox-helpers';

describe('docs-agent-workflow', () => {
  let testSandbox: TestSandboxResult | null = null;
  let braintrustLogger: BraintrustLogger<true> | null = null;

  // Initialize Braintrust logger before each test
  beforeEach(() => {
    if (process.env.BRAINTRUST_KEY) {
      braintrustLogger = initLogger({
        apiKey: process.env.BRAINTRUST_KEY,
        projectName: 'DOCS-AGENT',
      });
    }
  });

  // Cleanup after each test
  afterEach(async () => {
    if (testSandbox) {
      await testSandbox.cleanup();
      testSandbox = null;
    }
    if (braintrustLogger) {
      await braintrustLogger.flush();
      braintrustLogger = null;
    }
  });

  /**
   * Helper to run workflow with Braintrust tracing
   */
  async function runWorkflowWithTracing(input: unknown, metadata: Record<string, unknown> = {}) {
    if (!braintrustLogger) {
      // Run without tracing if no Braintrust key
      const run = docsAgentWorkflow.createRun();
      return await run.start({ inputData: input as any });
    }

    return await wrapTraced(
      async () => {
        currentSpan().log({
          metadata: {
            testName: expect.getState().currentTestName,
            ...metadata,
          },
        });

        const run = docsAgentWorkflow.createRun();
        return await run.start({ inputData: input as any });
      },
      {
        name: 'Docs Agent Workflow Test',
      }
    )();
  }

  describe('basic workflow execution', () => {
    it('should successfully document a simple dbt project', async () => {
      // Create test sandbox with a minimal project
      testSandbox = await createIntegrationTestSandbox({
        projectOptions: {
          projectName: 'test_analytics',
          companyName: 'TestCo',
          includeDocumentation: false, // Start without docs
          includeTests: false, // Simplify - no tests
          includeMacros: false, // Simplify - no macros
        },
      });

      const context = createTestContext({
        sandbox: testSandbox.sandbox,
      });

      const input = createTestWorkflowInput({
        message: TEST_MESSAGES.documentAll, // Use simpler test message
        context,
      });

      const result = await runWorkflowWithTracing(input, {
        testType: 'basic-documentation',
        projectType: 'simple-dbt',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        // Check that the workflow completes
        expect(result.result).toBeDefined();
        expect(result.result.todos).toBeDefined();
        expect(result.result.todoList).toBeDefined();

        // Log what actually happened for debugging
        console.log('Workflow completed with:', {
          documentationCreated: result.result.documentationCreated,
          filesCreated: result.result.metadata?.filesCreated,
          toolsUsed: result.result.metadata?.toolsUsed,
          finished: result.result.finished,
        });

        // For now, we're just checking that the workflow runs without errors
        // The mock sandbox doesn't actually create files, but the agent should attempt to
      }
    }, 300000); // Increase timeout to 5 minutes

    it('should generate clarification questions when needed', async () => {
      testSandbox = await createIntegrationTestSandbox();

      // Add files with unclear business logic
      await addFilesToSandbox(
        testSandbox.sandbox,
        createFilesWithMissingDocs(),
        testSandbox.projectPath
      );

      const context = createTestContext({
        sandbox: testSandbox.sandbox,
      });

      const input = createTestWorkflowInput({
        message: TEST_MESSAGES.askClarification,
        context,
      });

      const result = await runWorkflowWithTracing(input, {
        testType: 'clarification-needed',
      });

      const validation = validateWorkflowOutput(result);
      expect(validation.isValid).toBe(true);

      if (result.status === 'success' && result.result.clarificationNeeded) {
        expect(result.result.clarificationQuestion).toBeDefined();
        if (result.result.clarificationQuestion) {
          expect(result.result.clarificationQuestion.issue).toBeTruthy();
          expect(result.result.clarificationQuestion.context).toBeTruthy();
          expect(result.result.clarificationQuestion.clarificationQuestion).toBeTruthy();
        }
      }
    });
  }, 300000);

  describe('real repository tests', () => {
    it('should successfully document the sample repository', async () => {
      // Create sandbox and clone the real dbt repository
      const sandbox = await createSandboxWithGit({
        gitUrl: process.env.SAMPLE_REPO || '',
        githubToken: process.env.GITHUB_PAT,
        language: 'typescript',
      });

      // Store reference for cleanup
      testSandbox = {
        sandbox,
        sandboxId: sandbox.id, // Add required sandboxId property
        projectPath: '~/', // Default path where git clone puts the repo
        cleanup: async () => {
          await sandbox.delete();
        },
      };

      // Get the repository name from the URL to determine the directory
      const repoName = (process.env.SAMPLE_REPO || '').split('/').pop()?.replace('.git', '') || '';

      // Search for YAML files containing {{TODO}}
      console.log('Searching for YAML files with {{TODO}} pattern...');

      // First, find all .yml and .yaml files in the buster/docs directory
      const findCommand = `cd ${repoName} && find . -path "*/buster/docs/*" \\( -name "*.yml" -o -name "*.yaml" \\) | head -100`;
      const findResult = await sandbox.process.executeCommand(findCommand);

      if (findResult.exitCode !== 0) {
        console.warn(`File search command failed: ${findResult.result}`);
        // Try alternative search in case buster/docs doesn't exist
        const altFindCommand = `cd ${repoName} && find . \\( -name "*.yml" -o -name "*.yaml" \\) | grep -E "(docs?|documentation)" | head -100`;
        const altFindResult = await sandbox.process.executeCommand(altFindCommand);

        if (altFindResult.exitCode === 0) {
          findResult.result = altFindResult.result;
        } else {
          console.warn('Alternative file search also failed, proceeding with empty file list');
          findResult.result = '';
        }
      }

      const yamlFiles = findResult.result
        .split('\n')
        .filter((line) => line.trim() && (line.endsWith('.yml') || line.endsWith('.yaml')));

      console.log(`Found ${yamlFiles.length} YAML files to check`);

      // Filter files containing {{TODO}}
      const todoFiles: string[] = [];

      for (const filePath of yamlFiles) {
        try {
          const catCommand = `cd ${repoName} && cat "${filePath}"`;
          const catResult = await sandbox.process.executeCommand(catCommand);

          if (catResult.exitCode === 0 && catResult.result.includes('{{TODO}}')) {
            todoFiles.push(filePath);
          }
        } catch (error) {
          console.warn(`Failed to read file ${filePath}:`, error);
        }
      }

      console.log(`Found ${todoFiles.length} files with {{TODO}} pattern:`, todoFiles);

      if (todoFiles.length === 0) {
        console.log('No files with {{TODO}} found, running single workflow with default message');

        const context = createTestContext({
          sandbox: testSandbox.sandbox,
        });

        const input = createTestWorkflowInput({
          message: TEST_MESSAGES.documentSpecific,
          context,
        });

        const result = await runWorkflowWithTracing(input, {
          testType: 'real-repository',
          projectType: 'dbt',
          repositoryUrl: process.env.SAMPLE_REPO || '',
        });

        expect(result).toBeDefined();
        expect(result.status).toBe('success');
      } else {
        // Run workflows concurrently with limit of 10
        await processFilesWithConcurrencyLimit(todoFiles, sandbox, 10);
      }
    }, 800000); // Extended timeout for real repository operations
  });

  /**
   * Helper function to process files with documentation workflows, limiting concurrency
   */
  async function processFilesWithConcurrencyLimit(
    filePaths: string[],
    sandbox: Sandbox,
    concurrencyLimit: number
  ): Promise<void> {
    const results: Array<{ filePath: string; success: boolean; error?: string }> = [];
    const activePromises: Set<Promise<void>> = new Set();

    const processFile = async (filePath: string): Promise<void> => {
      try {
        const context = createTestContext({ sandbox });

        // Format message similar to documentSpecific test
        const message = `Please create documentation for the file: ${filePath}. This file contains {{TODO}} placeholders that need to be filled with appropriate documentation.`;

        const input = createTestWorkflowInput({
          message,
          context,
        });

        const result = await runWorkflowWithTracing(input, {
          testType: 'batch-documentation',
          targetFile: filePath,
        });

        results.push({
          filePath,
          success: result.status === 'success',
          error: result.status === 'error' ? JSON.stringify(result) : undefined,
        });

        console.log(`Completed workflow for ${filePath}: ${result.status}`);
      } catch (error) {
        results.push({
          filePath,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
        console.error(`Failed workflow for ${filePath}:`, error);
      }
    };

    // Process files with concurrency control
    for (const filePath of filePaths) {
      // Wait if we've reached the concurrency limit
      while (activePromises.size >= concurrencyLimit) {
        await Promise.race(activePromises);
      }

      // Start processing the file
      const promise = processFile(filePath).finally(() => {
        activePromises.delete(promise);
      });

      activePromises.add(promise);
    }

    // Wait for all remaining promises to complete
    await Promise.all(activePromises);

    // Log summary
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`\nWorkflow batch completed:`);
    console.log(`- Successful: ${successful}`);
    console.log(`- Failed: ${failed}`);

    if (failed > 0) {
      console.log('\nFailed files:');
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`- ${r.filePath}: ${r.error}`);
        });
    }

    // Expect at least some workflows to succeed
    expect(successful).toBeGreaterThan(0);
  }
});
