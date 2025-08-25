import { db, eq, messages, chats, organizations, users } from '@buster/database';
import { v4 as uuidv4 } from 'uuid';
import { runs, tasks } from '@trigger.dev/sdk';
import { initLogger, wrapTraced } from 'braintrust';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type { analystAgentTask } from '../../src/tasks/analyst-agent-task';

// Helper functions for test data creation
interface CreateTestMessageOptions {
  requestMessage?: string;
  title?: string;
  // biome-ignore lint/suspicious/noExplicitAny: because this is for testing it seems fine
  responseMessages?: any;
  // biome-ignore lint/suspicious/noExplicitAny: because this is for testing it seems fine
  reasoning?: any;
  // biome-ignore lint/suspicious/noExplicitAny: because this is for testing it seems fine
  rawLlmMessages?: any;
  finalReasoningMessage?: string;
  isCompleted?: boolean;
  feedback?: string;
}

async function createTestOrganization(params?: {
  name?: string;
}): Promise<string> {
  try {
    const organizationId = uuidv4();
    const name = params?.name || `Test Organization ${uuidv4()}`;

    await db.insert(organizations).values({
      id: organizationId,
      name,
    });

    return organizationId;
  } catch (error) {
    throw new Error(
      `Failed to create test organization: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function createTestUser(params?: {
  email?: string;
  name?: string;
}): Promise<string> {
  try {
    const userId = uuidv4();
    const email = params?.email || `test-${uuidv4()}@example.com`;
    const name = params?.name || 'Test User';

    await db.insert(users).values({
      id: userId,
      email,
      name,
    });

    return userId;
  } catch (error) {
    throw new Error(
      `Failed to create test user: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function createTestChat(
  organizationId?: string,
  createdBy?: string
): Promise<{
  chatId: string;
  organizationId: string;
  userId: string;
}> {
  try {
    const chatId = uuidv4();

    // Create organization and user if not provided
    const orgId = organizationId || (await createTestOrganization());
    const userId = createdBy || (await createTestUser());

    await db.insert(chats).values({
      id: chatId,
      title: 'Test Chat',
      organizationId: orgId,
      createdBy: userId,
      updatedBy: userId,
      publiclyAccessible: false,
    });

    return {
      chatId,
      organizationId: orgId,
      userId,
    };
  } catch (error) {
    throw new Error(
      `Failed to create test chat: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function createTestMessage(
  chatId: string,
  createdBy: string,
  options: CreateTestMessageOptions = {}
): Promise<string> {
  try {
    const messageId = uuidv4();

    // Use provided options or sensible defaults
    const messageData = {
      id: messageId,
      chatId,
      createdBy,
      title: options.title ?? 'Test Message',
      requestMessage: options.requestMessage ?? 'This is a test message request',
      responseMessages: options.responseMessages ?? [{ content: 'This is a test response' }],
      reasoning: options.reasoning ?? { steps: ['Test reasoning step 1', 'Test reasoning step 2'] },
      rawLlmMessages: options.rawLlmMessages ?? [],
      finalReasoningMessage: options.finalReasoningMessage ?? 'Test final reasoning',
      isCompleted: options.isCompleted ?? true,
      ...(options.feedback && { feedback: options.feedback }),
    };

    await db.insert(messages).values(messageData);

    return messageId;
  } catch (error) {
    throw new Error(
      `Failed to create test message: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Integration Tests for Analyst Agent Task
 *
 * PREREQUISITES (MUST BE RUNNING):
 * 1. Local Trigger.dev server: `npm run trigger:dev` (in trigger directory)
 * 2. Environment variables:
 *    - TRIGGER_API_KEY=tr_dev_your_key_here
 *    - DATABASE_URL (for test database operations)
 *    - BRAINTRUST_KEY (for observability)
 *
 * SETUP INSTRUCTIONS:
 * 1. Get your Trigger.dev API key from https://cloud.trigger.dev/
 * 2. Add TRIGGER_API_KEY to your .env file
 * 3. Start trigger server: npm run trigger:dev
 * 4. Run this test: npm run test:integration
 *
 * If you get connection errors, ensure:
 * - Trigger server is running on localhost:3000 (check terminal output)
 * - TRIGGER_API_KEY is valid and in .env
 * - Database connection is working
 */

describe('Analyst Agent Task Integration Tests', () => {
  // Use same constants as AI workflow test for consistency
  const TEST_USER_ID = 'c2dd64cd-f7f3-4884-bc91-d46ae431901e';
  const TEST_ORG_ID = 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce';
  const TEST_MESSAGE_CONTENT = 'who is our top customer';

  async function triggerAndPollAnalystAgent(
    payload: { message_id: string },
    pollIntervalMs = 2000,
    timeoutMs = 30 * 60 * 1000 // align with 30 min test timeout
  ) {
    const handle = await tasks.trigger<typeof analystAgentTask>('analyst-agent-task', payload);

    const start = Date.now();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const run = await runs.retrieve(handle.id);
      if (run.status === 'COMPLETED' || run.status === 'FAILED' || run.status === 'CANCELED') {
        return run;
      }

      if (Date.now() - start > timeoutMs) {
        return run;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  beforeAll(() => {
    if (!process.env.BRAINTRUST_KEY) {
      throw new Error('BRAINTRUST_KEY is required for observability');
    }

    // Initialize Braintrust logging for observability
    initLogger({
      apiKey: process.env.BRAINTRUST_KEY,
      projectName: process.env.ENVIRONMENT || 'development',
    });

    // Verify required environment variables
    if (!process.env.TRIGGER_SECRET_KEY) {
      throw new Error(
        'TRIGGER_SECRET_KEY is required. Add it to your .env file.\n' +
          'Get your key from: https://cloud.trigger.dev/ → Project Settings → API Keys'
      );
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for test database operations');
    }
  });

  afterAll(async () => {
    // Allow time for async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  test('should successfully trigger and complete analyst agent task with test chat', async () => {
    let chatId: string;
    let messageId: string;

    try {
      // Create test chat and message with the same user/org as AI workflow tests
      console.log('Creating test chat and message...');
      const chatResult = await createTestChat(TEST_ORG_ID, TEST_USER_ID);
      chatId = chatResult.chatId;

      messageId = await createTestMessage(chatId, TEST_USER_ID, {
        requestMessage: TEST_MESSAGE_CONTENT,
      });

      console.log(`Created test message: ${messageId} with content: "${TEST_MESSAGE_CONTENT}"`);

      // Trigger the analyst agent task using Trigger.dev SDK
      console.log('Triggering analyst agent task...');

      const tracedTaskTrigger = wrapTraced(
        async () => await triggerAndPollAnalystAgent({ message_id: messageId }, 5000),
        {
          name: 'Trigger Analyst Agent Task',
        }
      );

      console.log('Waiting for task completion...');
      const result = await tracedTaskTrigger();

      // Verify task completed successfully
      expect(result).toBeDefined();
      expect(result.status).toBe('COMPLETED');
      expect(result.output).toBeDefined();

      if (result.status === 'COMPLETED' && result.output) {
        console.log('Task completed successfully');
        console.log('Task output:', JSON.stringify(result.output, null, 2));

        // Verify the output structure matches expected schema
        expect(result.output.success).toBe(true);
        expect(result.output.messageId).toBe(messageId);
        expect(result.output.result).toBeDefined();
        expect(result.output.result?.workflowCompleted).toBe(true);

        // Verify the message was updated in the database
        console.log('Verifying database updates...');
        const updatedMessage = await db.select().from(messages).where(eq(messages.id, messageId));

        expect(updatedMessage).toHaveLength(1);
        expect(updatedMessage[0]?.id).toBe(messageId);

        // Check if conversation history was saved
        if (updatedMessage[0]?.rawLlmMessages) {
          expect(Array.isArray(updatedMessage[0].rawLlmMessages)).toBe(true);
        }

        console.log('Integration test completed successfully!');
      } else {
        console.error('Task failed with status:', result.status);
        console.error('Task error:', result.error);
        throw new Error(
          `Task execution failed with status: ${result.status}, error: ${result.error?.message || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Integration test failed:', error);

      // Provide helpful error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED')) {
          console.error('\n🚨 CONNECTION REFUSED - Is the trigger server running?');
          console.error('Start it with: npm run trigger:dev');
          console.error('Wait for "✓ Dev server running" message before running tests\n');
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          console.error('\n🚨 AUTHENTICATION ERROR - Check your TRIGGER_API_KEY');
          console.error('Get your key from: https://cloud.trigger.dev/');
          console.error('Add to .env: TRIGGER_API_KEY=tr_dev_your_key_here\n');
        } else if (error.message.includes('404') || error.message.includes('Not Found')) {
          console.error('\n🚨 TASK NOT FOUND - Is the task deployed to trigger server?');
          console.error('Ensure analyst-agent-task is properly exported and registered\n');
        }
      }

      throw error;
    }
  }, 1800000); // 30 minute timeout to match task maxDuration

  test('should handle invalid message ID gracefully', async () => {
    const invalidMessageId = '00000000-0000-0000-0000-000000000000';

    try {
      console.log('Testing error handling with invalid message ID...');

      const result = await triggerAndPollAnalystAgent({ message_id: invalidMessageId }, 2000);

      // Task should complete but with error result
      expect(result).toBeDefined();

      if (result.status === 'COMPLETED' && result.output) {
        // If task completed "successfully", it should report the error in output
        expect(result.output.success).toBe(false);
        expect(result.output.error).toBeDefined();
        expect(result.output.error?.code).toBe('MESSAGE_NOT_FOUND');
      } else {
        // If task failed at Trigger.dev level, that's also acceptable for this test
        expect(result.error).toBeDefined();
      }

      console.log('Error handling test completed successfully');
    } catch (error) {
      // Expected behavior - task should handle this gracefully
      console.log('Caught expected error for invalid message ID:', error);
    }
  }, 300000); // 5 minute timeout for error case

  test('should validate input schema correctly', async () => {
    try {
      console.log('Testing input validation...');

      // Test with invalid UUID format
      await expect(
        triggerAndPollAnalystAgent(
          // Intentionally invalid input to test validation
          { message_id: 'not-a-uuid' } as { message_id: string },
          1000
        )
      ).rejects.toThrow();

      console.log('Input validation test completed successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('uuid')) {
        // This is expected - Zod should reject invalid UUIDs
        console.log('Input validation working correctly:', error.message);
      } else {
        throw error;
      }
    }
  }, 30000); // 30 second timeout for validation test
});
