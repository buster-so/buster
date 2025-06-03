import { RuntimeContext } from '@mastra/core/runtime-context';
import { initLogger } from 'braintrust';
import { beforeAll, describe, test } from 'vitest';
import analystWorkflow, {
  type AnalystWorkflowRuntimeContext,
} from '../../../src/workflows/analyst-workflow';

describe('Analyst Workflow Integration Tests', () => {
  beforeAll(() => {
    // Initialize Braintrust logger for testing
    initLogger({
      apiKey: process.env.BRAINTRUST_KEY,
      projectName: 'Development',
    });
  });

  test('should successfully execute analyst workflow with valid input', async () => {
    const testInput = {
      prompt: 'Analyze the quarterly sales data and create action items for improving performance',
    };

    const runtimeContext = new RuntimeContext<AnalystWorkflowRuntimeContext>([
      ['userId', 'test-user-123'],
      ['threadId', 'test-thread-456'],
    ]);

    // Create and run the workflow
    const run = analystWorkflow.createRun();

    const result = await run.stream({
      inputData: testInput,
      runtimeContext,
    });

    for await (const event of result.stream) {
      console.log(event);
    }
  }, 0);
});
