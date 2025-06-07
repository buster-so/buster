import { db, eq, messages } from '@buster/database';
import { createTestChat, createTestMessage } from '@buster/test-utils';
import { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { initLogger, wrapTraced } from 'braintrust';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
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
    // Use the provided conversation history from think-and-prep to analyst
    const conversationHistory: CoreMessage[] = [
      {
        content: [
          {
            text: 'what are our top 10 products from the last 6 months',
            type: 'text',
          },
        ],
        role: 'user',
      },
    ];

    const testInput = {
      prompt: 'What is the follow-up analysis for the previous customer data?',
      conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined,
    };

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
    runtimeContext.set('threadId', crypto.randomUUID());
    runtimeContext.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
    runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
    runtimeContext.set('dataSourceSyntax', 'postgres');
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
    expect(result).toBeDefined();
    console.log('Workflow result:', result);
  }, 300000);

  test('should successfully execute analyst workflow with messageId for database save', async () => {
    // Create test chat and message in database
    const { chatId, organizationId, userId } = await createTestChat();
    const messageId = await createTestMessage(chatId, userId);

    const testInput = {
      prompt: 'What are the top 5 customers by revenue this month?',
    };

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', userId);
    runtimeContext.set('threadId', chatId);
    runtimeContext.set('organizationId', organizationId);
    runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
    runtimeContext.set('dataSourceSyntax', 'postgres');
    runtimeContext.set('messageId', messageId); // This should trigger database saves

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
    expect(result).toBeDefined();
    console.log('Workflow result:', result);

    // Verify that conversation history was saved to database
    const updatedMessage = await db.select().from(messages).where(eq(messages.id, messageId));
    expect(updatedMessage).toHaveLength(1);
    expect(updatedMessage[0]!.rawLlmMessages).toBeDefined();
    expect(Array.isArray(updatedMessage[0]!.rawLlmMessages)).toBe(true);
    if (Array.isArray(updatedMessage[0]!.rawLlmMessages)) {
      expect(updatedMessage[0]!.rawLlmMessages.length).toBeGreaterThan(0);
    }
  }, 300000);

  test('should successfully execute analyst workflow with valid input', async () => {
    const testInput = {
      prompt:
        'I have a tracking number for KittySpout (team ID 6650d2d6ce4d87ec5a2115ae). I need to know what order number this is for. Please provide the order number. 797355046454',
    };

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
    runtimeContext.set('threadId', crypto.randomUUID());
    runtimeContext.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
    runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
    runtimeContext.set('dataSourceSyntax', 'postgres');

    const tracedWorkflow = wrapTraced(
      async () => {
        const run = analystWorkflow.createRun();
        return await run.start({
          inputData: testInput,
          runtimeContext,
        });
      },
      { name: 'Analyst Workflow Basic Test' }
    );

    const result = await tracedWorkflow();
    expect(result).toBeDefined();
    console.log('Workflow result:', result);
  }, 300000);

  test('should successfully execute analyst workflow with valid input', async () => {
    const testInput = {
      prompt:
        'I have a tracking number for KittySpout (team ID 6650d2d6ce4d87ec5a2115ae). I need to know what order number this is for. Please provide the order number. 797355046454',
    };

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
    runtimeContext.set('threadId', crypto.randomUUID());
    runtimeContext.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
    runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
    runtimeContext.set('dataSourceSyntax', 'postgres');

    const tracedWorkflow = wrapTraced(
      async () => {
        const run = analystWorkflow.createRun();
        return await run.start({
          inputData: testInput,
          runtimeContext,
        });
      },
      { name: 'Analyst Workflow Basic Test' }
    );

    const result = await tracedWorkflow();
    expect(result).toBeDefined();
    console.log('Workflow result:', result);
  }, 300000);
});
