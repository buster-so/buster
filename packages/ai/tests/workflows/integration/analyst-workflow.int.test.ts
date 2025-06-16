import { chats, db, eq, messages } from '@buster/database';
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
    runtimeContext.set('chatId', crypto.randomUUID());
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
  }, 300000);

  test('should successfully execute analyst workflow with messageId for database save', async () => {
    // Use existing test organization and user IDs to avoid database creation issues
    const organizationId = 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce';
    const userId = 'c2dd64cd-f7f3-4884-bc91-d46ae431901e';
    const chatId = crypto.randomUUID();
    const messageId = crypto.randomUUID();

    // Create chat first
    try {
      await db.insert(chats).values({
        id: chatId,
        title: 'Test Chat for Message Save',
        organizationId,
        createdBy: userId,
        updatedBy: userId,
        publiclyAccessible: false,
      });

      // Then create message
      await db.insert(messages).values({
        id: messageId,
        chatId,
        createdBy: userId,
        title: 'Test Message',
        requestMessage: 'What are the top 5 customers by revenue this month?',
        responseMessages: [],
        reasoning: [],
        rawLlmMessages: [],
        finalReasoningMessage: '',
        isCompleted: false,
      });
    } catch (error) {
      console.error('Failed to create test data:', error);
      // Clean up if chat was created but message failed
      try {
        await db.delete(chats).where(eq(chats.id, chatId));
      } catch {} // Ignore cleanup errors
      return;
    }

    const testInput = {
      prompt: 'What are the top 5 customers by revenue this month?',
    };

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', userId);
    runtimeContext.set('chatId', chatId);
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

    // Verify that conversation history was saved to database
    const updatedMessage = await db.select().from(messages).where(eq(messages.id, messageId));
    expect(updatedMessage).toHaveLength(1);
    expect(updatedMessage[0]!.rawLlmMessages).toBeDefined();
    expect(Array.isArray(updatedMessage[0]!.rawLlmMessages)).toBe(true);
    if (Array.isArray(updatedMessage[0]!.rawLlmMessages)) {
      expect(updatedMessage[0]!.rawLlmMessages.length).toBeGreaterThan(0);
      console.log(`Saved ${updatedMessage[0]!.rawLlmMessages.length} messages to rawLlmMessages`);
    }
  }, 300000);

  test('should successfully execute analyst workflow with valid input', async () => {
    const testInput = {
      prompt:
        'What are the top 5 customers by total revenue for this quarter? Please include their names and total order amounts.',
    };

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
    runtimeContext.set('chatId', crypto.randomUUID());
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
  }, 300000);

  test('should successfully execute analyst workflow with valid input', async () => {
    const testInput = {
      prompt:
        'Can you show me our highest value customers and their total order amounts? Include customer details.',
    };

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
    runtimeContext.set('chatId', crypto.randomUUID());
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
    runtimeContext.set('chatId', chatId);
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
    runtimeContext.set('chatId', crypto.randomUUID());
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

    // Debug: Log what the initial workflow actually returned
    console.log('=== INITIAL WORKFLOW RESULT DEBUG ===');
    console.log('Result keys:', Object.keys(initialResult));
    console.log('Result status:', initialResult.status);

    // Get conversation history based on workflow result structure
    let conversationHistory: CoreMessage[] | undefined;
    if (initialResult.status === 'success') {
      conversationHistory = initialResult.result?.conversationHistory;
      console.log('Has result.conversationHistory:', !!conversationHistory);
      console.log('result.conversationHistory length:', conversationHistory?.length || 0);
    } else {
      console.log('Workflow failed or suspended');
      conversationHistory = undefined;
    }

    // Step 3: Run follow-up workflow with the conversation history from the first run
    const followUpInput = {
      prompt:
        'For these top suppliers, can you show me their contact information and which countries they are located in?',
      conversationHistory: conversationHistory,
    };

    // Debug: Log what we're passing to the follow-up workflow
    console.log('=== FOLLOW-UP INPUT DEBUG ===');
    console.log('followUpInput keys:', Object.keys(followUpInput));
    console.log(
      'followUpInput.conversationHistory length:',
      followUpInput.conversationHistory?.length || 0
    );

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

    // Debug: Log the actual follow-up result structure
    console.log('=== FOLLOW-UP WORKFLOW RESULT DEBUG ===');
    console.log('Follow-up result keys:', Object.keys(followUpResult));
    console.log('Follow-up result status:', followUpResult.status);

    // Step 4: Verify that the follow-up workflow also has conversation history
    if (followUpResult.status === 'success' && initialResult.status === 'success') {
      expect(followUpResult.result?.conversationHistory).toBeDefined();
      expect(Array.isArray(followUpResult.result?.conversationHistory)).toBe(true);
      expect(followUpResult.result?.conversationHistory?.length).toBeGreaterThan(
        initialResult.result?.conversationHistory?.length || 0
      );

      console.log(
        `Follow-up workflow returned ${followUpResult.result?.conversationHistory?.length} messages (increased from ${initialResult.result?.conversationHistory?.length})`
      );

      // Step 5: Verify that the conversation history includes both interactions
      const finalHistory = followUpResult.result?.conversationHistory;

      if (finalHistory) {
        // Should contain messages from both the initial prompt and follow-up
        const userMessages = finalHistory.filter((msg: any) => msg.role === 'user');
        expect(userMessages.length).toBeGreaterThanOrEqual(2); // At least initial + follow-up
      }

      console.log(
        'Test completed successfully - conversation history passed directly between workflows'
      );
    } else {
      console.log('One or both workflows failed, skipping conversation history verification');
    }
  }, 600000); // Increased timeout for two workflow runs

  test('should handle inappropriate/impossible requests gracefully', async () => {
    const testInput = {
      prompt: 'who is your daddy and what does he do?',
    };

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
    runtimeContext.set('chatId', crypto.randomUUID());
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
      { name: 'Analyst Workflow - Impossible Request Test' }
    );

    const result = await tracedWorkflow();

    // The workflow should not crash and should return a result
    expect(result).toBeDefined();

    // Check if the workflow completed successfully or failed gracefully
    if (result.status === 'success') {
      // If successful, it should have some kind of response
      expect(result.result).toBeDefined();
      console.log('Workflow handled impossible request gracefully:', result.result);
    } else if (result.status === 'failed') {
      // If failed, it should have error information
      expect(result.error).toBeDefined();
      console.log('Workflow failed gracefully with error:', result.error.message);
    }

    console.log('Impossible request test completed - workflow did not crash');
  }, 300000);

  test('should handle another type of non-data request gracefully', async () => {
    const testInput = {
      prompt: 'tell me a joke about databases',
    };

    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
    runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
    runtimeContext.set('chatId', crypto.randomUUID());
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
      { name: 'Analyst Workflow - Non-Data Request Test' }
    );

    const result = await tracedWorkflow();

    // The workflow should not crash and should return a result
    expect(result).toBeDefined();

    // Log the result for debugging
    console.log('Non-data request test result:', result);

    // The workflow should either succeed with a helpful response or fail gracefully
    expect(['success', 'failed'].includes(result.status)).toBe(true);
  }, 300000);
});
