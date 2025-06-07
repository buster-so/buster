import { RuntimeContext } from '@mastra/core/runtime-context';
import { initLogger, wrapTraced } from 'braintrust';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type { CoreMessage } from 'ai';
import { db } from '../../../../../packages/database/src/connection';
import { messages } from '../../../../../packages/database/src/schema';
import { eq } from 'drizzle-orm';
import analystWorkflow, {
  type AnalystRuntimeContext,
} from '../../../src/workflows/analyst-workflow';
import { createMinimalTestChat, createTestMessage } from '../../helpers';

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
            text: "what are our top 10 products from the last 6 months",
            type: "text"
          }
        ],
        role: "user"
      }
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
    expect(result).toBeDefined();
    console.log('Workflow result:', result);
  }, 300000);

  test('should successfully execute analyst workflow with messageId for database save', async () => {
    // Create test chat and message in database
    const { chatId, organizationId, userId } = await createMinimalTestChat();
    const messageId = await createTestMessage(chatId, userId);

    const testInput = {
      prompt: 'What are the top 5 customers by revenue this month?',
    };

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', userId);
    runtimeContext.set('threadId', chatId);
    runtimeContext.set('organizationId', organizationId);
    runtimeContext.set('dataSourceId', 'd3476e3c-7e95-4a42-9abc-2afbbca87a39');
    runtimeContext.set('dataSourceSyntax', 'snowflake');
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
    expect(updatedMessage[0].rawLlmMessages).toBeDefined();
    expect(Array.isArray(updatedMessage[0].rawLlmMessages)).toBe(true);
    if (Array.isArray(updatedMessage[0].rawLlmMessages)) {
      expect(updatedMessage[0].rawLlmMessages.length).toBeGreaterThan(0);
    }
  }, 300000);

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
      { name: 'Analyst Workflow Basic Test' }
    );

    const result = await tracedWorkflow();
    expect(result).toBeDefined();
    console.log('Workflow result:', result);
  }, 300000);
});
