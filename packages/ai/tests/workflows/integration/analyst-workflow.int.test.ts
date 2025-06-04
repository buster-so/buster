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
    await new Promise((resolve) => setTimeout(resolve, 10000));
  });

  test('should successfully execute analyst workflow with valid input', async () => {
    const testInput = {
      prompt: 'what is the carbon footprint of our production process per product unit',
    };

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
    runtimeContext.set('threadId', crypto.randomUUID());
    runtimeContext.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
    runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
    runtimeContext.set('dataSourceSyntax', 'postgresql');

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

    const _result = await tracedWorkflow();
  }, 0);
});
