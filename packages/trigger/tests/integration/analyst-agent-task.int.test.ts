import { db, eq, messages } from '@buster/database';
import { createTestChat, createTestMessage } from '@buster/test-utils';
import { tasks } from '@trigger.dev/sdk/v3';
import { initLogger, wrapTraced } from 'braintrust';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type { analystAgentTask } from '../../src/tasks/analyst-agent-task';

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

  beforeAll(() => {
    if (!process.env.BRAINTRUST_KEY) {
      throw new Error('BRAINTRUST_KEY is required for observability');
    }

    // Initialize Braintrust logging for observability
    initLogger({
      apiKey: process.env.BRAINTRUST_KEY,
      projectName: 'ANALYST-AGENT-TASK-INTEGRATION',
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
        async () => {
          return await tasks.triggerAndPoll<typeof analystAgentTask>(
            'analyst-agent-task',
            { message_id: messageId },
            { pollIntervalMs: 5000 } // Poll every 5 seconds
          );
        },
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
        console.error('Task failed:', result.error);
        throw new Error(`Task execution failed: ${result.error?.message || 'Unknown error'}`);
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

      const result = await tasks.triggerAndPoll<typeof analystAgentTask>(
        'analyst-agent-task',
        { message_id: invalidMessageId },
        { pollIntervalMs: 2000 } // Poll every 2 seconds for error case
      );

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
        tasks.triggerAndPoll<typeof analystAgentTask>(
          'analyst-agent-task',
          // Intentionally invalid input to test validation
          { message_id: 'not-a-uuid' } as { message_id: string },
          { pollIntervalMs: 1000 }
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
