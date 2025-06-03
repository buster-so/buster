import { RuntimeContext } from '@mastra/core/runtime-context';
import { initLogger, wrapTraced } from 'braintrust';
import { afterAll, beforeAll, describe, test } from 'vitest';
import analystWorkflow, {
  type AnalystRuntimeContext,
} from '../../../src/workflows/analyst-workflow';

describe('Analyst Workflow Integration Tests', () => {
  beforeAll(() => {
    initLogger({
      apiKey: process.env.BRAINTRUST_KEY,
      projectName: 'ANALYST-WORKFLOW',
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  test('should successfully execute analyst workflow with valid input', async () => {
    const testInput = {
      prompt: 'Analyze the quarterly sales data and create action items for improving performance',
    };

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>([
      ['userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e'],
      ['threadId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e'],
      ['organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce'],
      ['dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a'],
      ['dataSourceSyntax', 'postgresql'],
    ]);

    const tracedWorkflow = wrapTraced(
      async () => {
        const run = analystWorkflow.createRun();
        return await run.start({
          inputData: testInput,
          runtimeContext,
        });
      },
      { name: 'Analyst Workflow' }
    );

    const result = await tracedWorkflow();
    console.log(result);
  }, 0);

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
  });
});
