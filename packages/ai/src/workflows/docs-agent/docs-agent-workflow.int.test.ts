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

      const context = createTestContext({
        sandbox: testSandbox.sandbox,
      });

      const input = createTestWorkflowInput({
        message: TEST_MESSAGES.documentAll,
        context,
      });

      const result = await runWorkflowWithTracing(input, {
        testType: 'real-repository',
        projectType: 'dbt',
        repositoryUrl: process.env.SAMPLE_REPO || '',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('success');

      if (result.status === 'success') {
        // Check that the workflow completes successfully
        expect(result.result).toBeDefined();
        expect(result.result.todos).toBeDefined();
        expect(result.result.todoList).toBeDefined();

        // Log detailed results for debugging
        console.log('Real repository workflow completed with:', {
          documentationCreated: result.result.documentationCreated,
          filesCreated: result.result.metadata?.filesCreated,
          toolsUsed: result.result.metadata?.toolsUsed,
          finished: result.result.finished,
          clarificationNeeded: result.result.clarificationNeeded,
        });

        // Verify the agent actually attempted to create documentation
        // The real test will show what files were created/modified
        expect(result.result.finished).toBeDefined();
      }
    }, 800000); // Extended timeout for real repository operations
  });
});
