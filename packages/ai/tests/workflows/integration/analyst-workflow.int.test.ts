import { RuntimeContext } from '@mastra/core/runtime-context';
import { wrapTraced } from 'braintrust';
import { beforeAll, describe, test } from 'vitest';
import analystWorkflow, {
  type AnalystWorkflowRuntimeContext,
} from '../../../src/workflows/analyst-workflow';

describe('Analyst Workflow Integration Tests', () => {
  beforeAll(() => {});

  test('should successfully execute analyst workflow with valid input', async () => {
    const testInput = {
      prompt: 'Analyze the quarterly sales data and create action items for improving performance',
    };

    const runtimeContext = new RuntimeContext<AnalystWorkflowRuntimeContext>([
      ['userId', 'test-user-123'],
      ['threadId', 'test-thread-456'],
    ]);

    const tracedWorkflow = wrapTraced(
      async () => {
        const run = analystWorkflow.createRun();
        return await run.stream({
          inputData: testInput,
          runtimeContext,
        });
      },
      { name: 'Analyst Workflow' }
    );

    const result = await tracedWorkflow();

    for await (const event of result.stream) {
      console.log(event);
    }
  }, 0);
});
