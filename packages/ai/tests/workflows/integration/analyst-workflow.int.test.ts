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

  test('should successfully execute analyst workflow with conversation history', async () => {
    // Stubbed conversation history - to be filled in later
    const conversationHistory: any[] = [
      // TODO: Add stubbed conversation history here
    ];

    const testInput = {
      prompt: 'What is the follow-up analysis for the previous customer data?',
      conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined,
    };

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'a9e5c098-70b8-49b5-8678-77034f0f8570');
    runtimeContext.set('threadId', crypto.randomUUID());
    runtimeContext.set('organizationId', 'ce0133f9-e761-4324-a43a-64fcf64003d4');
    runtimeContext.set('dataSourceId', 'd3476e3c-7e95-4a42-9abc-2afbbca87a39');
    runtimeContext.set('dataSourceSyntax', 'snowflake');
    // Note: No messageId set to test non-database scenario

    const tracedWorkflow = wrapTraced(
      async () => {
        const run = analystWorkflow.createRun();
        return await run.start({
          inputData: testInput,
          runtimeContext,
        });
      },
      { name: 'Analyst Workflow with History' }
    );

    const result = await tracedWorkflow();
    console.log('Workflow result:', result);
  }, 0);

  test('should successfully execute analyst workflow with messageId for database save', async () => {
    // TODO: Add helper function to create test message in database
    const testMessageId = 'test-message-id-123';

    const testInput = {
      prompt: 'What are the top 5 customers by revenue this month?',
    };

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'a9e5c098-70b8-49b5-8678-77034f0f8570');
    runtimeContext.set('threadId', crypto.randomUUID());
    runtimeContext.set('organizationId', 'ce0133f9-e761-4324-a43a-64fcf64003d4');
    runtimeContext.set('dataSourceId', 'd3476e3c-7e95-4a42-9abc-2afbbca87a39');
    runtimeContext.set('dataSourceSyntax', 'snowflake');
    runtimeContext.set('messageId', testMessageId); // This should trigger database saves

    const tracedWorkflow = wrapTraced(
      async () => {
        const run = analystWorkflow.createRun();
        return await run.start({
          inputData: testInput,
          runtimeContext,
        });
      },
      { name: 'Analyst Workflow with Database Save' }
    );

    const result = await tracedWorkflow();
    console.log('Workflow result:', result);
    
    // TODO: Add verification that conversation history was saved to database
    // This would require a helper function to check the database
  }, 0);

  test('should successfully execute analyst workflow with valid input', async () => {
    const testInput = {
      prompt:
        'I have a tracking number for KittySpout (team ID 6650d2d6ce4d87ec5a2115ae). I need to know what order number this is for. Please provide the order number. 797355046454',
    };

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'a9e5c098-70b8-49b5-8678-77034f0f8570');
    runtimeContext.set('threadId', crypto.randomUUID());
    runtimeContext.set('organizationId', 'ce0133f9-e761-4324-a43a-64fcf64003d4');
    runtimeContext.set('dataSourceId', 'd3476e3c-7e95-4a42-9abc-2afbbca87a39');
    runtimeContext.set('dataSourceSyntax', 'snowflake');

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
    console.log('Workflow result:', result);
  }, 0);
});
