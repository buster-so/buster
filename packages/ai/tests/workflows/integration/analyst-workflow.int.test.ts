import { db, eq, messages } from '@buster/database';
import { createTestChat, createTestMessage } from '@buster/test-utils';
import { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { initLogger, wrapTraced } from 'braintrust';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { getRawLlmMessagesByMessageId } from '../../../src';
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
            text: 'what are our top 10 products from the last 6 months from accessories',
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

  test('should execute initial message then follow-up with retrieved conversation history', async () => {
    // Step 1: Create test chat and message in database
    // Use the same organizationId and userId as other tests to ensure they exist
    const organizationId = 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce';
    const userId = 'c2dd64cd-f7f3-4884-bc91-d46ae431901e';
    const { chatId } = await createTestChat(organizationId, userId);
    const messageId = await createTestMessage(chatId, userId);

    // Step 2: Run initial workflow with messageId to save conversation history
    const initialInput = {
      prompt: 'What are our top 5 products by revenue in the last quarter?',
    };

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', userId);
    runtimeContext.set('threadId', chatId);
    runtimeContext.set('organizationId', organizationId);
    runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
    runtimeContext.set('dataSourceSyntax', 'postgres');
    runtimeContext.set('messageId', messageId); // This triggers saving to rawLlmMessages

    console.log('Running initial workflow with messageId:', messageId);

    const initialTracedWorkflow = wrapTraced(
      async () => {
        const run = analystWorkflow.createRun();
        return await run.start({
          inputData: initialInput,
          runtimeContext,
        });
      },
      { name: 'Initial Message Workflow' }
    );

    const initialResult = await initialTracedWorkflow();
    expect(initialResult).toBeDefined();
    console.log('Initial workflow completed');

    // Step 3: Retrieve conversation history from database
    console.log('Retrieving conversation history from database...');
    const conversationHistory = await getRawLlmMessagesByMessageId(messageId);

    // Verify conversation history was saved
    expect(conversationHistory).toBeDefined();
    expect(conversationHistory).not.toBeNull();
    if (conversationHistory) {
      expect(Array.isArray(conversationHistory)).toBe(true);
      expect(conversationHistory.length).toBeGreaterThan(0);
      console.log(`Retrieved ${conversationHistory.length} messages from conversation history`);
    }

    // Step 4: Run follow-up workflow with retrieved conversation history
    const followUpInput = {
      prompt: 'Can you show me the year-over-year growth for these top products?',
      conversationHistory: conversationHistory as CoreMessage[],
    };

    // Create new message for follow-up
    const followUpMessageId = await createTestMessage(chatId, userId);
    runtimeContext.set('messageId', followUpMessageId);

    console.log('Running follow-up workflow with conversation history...');

    const followUpTracedWorkflow = wrapTraced(
      async () => {
        const run = analystWorkflow.createRun();
        return await run.start({
          inputData: followUpInput,
          runtimeContext,
        });
      },
      { name: 'Follow-up Message Workflow' }
    );

    const followUpResult = await followUpTracedWorkflow();
    expect(followUpResult).toBeDefined();
    console.log('Follow-up workflow completed');

    // Verify both messages were saved to database
    const allMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);

    expect(allMessages).toHaveLength(2);
    expect(allMessages[0]!.id).toBe(messageId);
    expect(allMessages[1]!.id).toBe(followUpMessageId);

    // Verify both have rawLlmMessages
    expect(allMessages[0]!.rawLlmMessages).toBeDefined();
    expect(allMessages[1]!.rawLlmMessages).toBeDefined();

    console.log('Test completed successfully - both messages saved with conversation history');
  }, 600000); // Increased timeout for two workflow runs

  test('should execute workflow with conversation history passed directly from first to second run', async () => {
    // Step 1: Run initial workflow WITHOUT database save (no messageId)
    const initialInput = {
      prompt: 'What are the top 3 suppliers by total order value in our database?',
    };

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
    runtimeContext.set('threadId', crypto.randomUUID());
    runtimeContext.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
    runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
    runtimeContext.set('dataSourceSyntax', 'postgres');
    // Note: No messageId set - this should prevent database save and allow direct output usage

    console.log('Running initial workflow without database save...');

    const initialTracedWorkflow = wrapTraced(
      async () => {
        const run = analystWorkflow.createRun();
        return await run.start({
          inputData: initialInput,
          runtimeContext,
        });
      },
      { name: 'Initial Workflow (No Database)' }
    );

    const initialResult = await initialTracedWorkflow();
    expect(initialResult).toBeDefined();
    console.log('Initial workflow completed');

    // Step 3: Run follow-up workflow with the conversation history from the first run
    const followUpInput = {
      prompt: 'For these top suppliers, can you show me their contact information and which countries they are located in?',
      conversationHistory: initialResult.conversationHistory as CoreMessage[],
    };

    console.log('Running follow-up workflow with conversation history from first run...');

    const followUpTracedWorkflow = wrapTraced(
      async () => {
        const run = analystWorkflow.createRun();
        return await run.start({
          inputData: followUpInput,
          runtimeContext, // Reuse same context (but still no messageId for database save)
        });
      },
      { name: 'Follow-up Workflow (Direct History)' }
    );

    const followUpResult = await followUpTracedWorkflow();
    expect(followUpResult).toBeDefined();
    console.log('Follow-up workflow completed');

    // Step 4: Verify that the follow-up workflow also has conversation history
    expect(followUpResult).toHaveProperty('conversationHistory');
    expect(Array.isArray(followUpResult.conversationHistory)).toBe(true);
    expect(followUpResult.conversationHistory.length).toBeGreaterThan(initialResult.conversationHistory.length);
    
    console.log(`Follow-up workflow returned ${followUpResult.conversationHistory.length} messages (increased from ${initialResult.conversationHistory.length})`);

    // Step 5: Verify that the conversation history includes both interactions
    const finalHistory = followUpResult.conversationHistory;
    
    // Should contain messages from both the initial prompt and follow-up
    const userMessages = finalHistory.filter((msg: any) => msg.role === 'user');
    expect(userMessages.length).toBeGreaterThanOrEqual(2); // At least initial + follow-up

    console.log('Test completed successfully - conversation history passed directly between workflows');
  }, 600000); // Increased timeout for two workflow runs
});
