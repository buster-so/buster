import { getRawLlmMessagesByMessageId } from '@buster/ai';
import { createTestChat, createTestMessage } from '@buster/test-utils/database/chats';
import { withTestEnv } from '@buster/test-utils/env-helpers';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTodosStep } from '../../../src/steps/create-todos-step';
import type { AnalystRuntimeContext } from '../../../src/workflows/analyst-workflow';

describe('Create Todos Step - Reasoning Integration', () => {
  beforeAll(async () => {
    await withTestEnv(async () => {
      // Environment setup
    });
  });

  afterAll(async () => {
    await withTestEnv(async () => {
      // Cleanup
    });
  });

  it('should save todo reasoning messages to database', async () => {
    await withTestEnv(async () => {
      // Create test data
      const { chatId, userId } = await createTestChat();
      const messageId = await createTestMessage({
        chatId,
        userId,
        role: 'user',
        content: 'What are the top 10 customers by revenue?',
      });

      // Create runtime context with messageId
      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('messageId', messageId);

      // Execute the step
      const result = await createTodosStep.execute({
        inputData: {
          prompt: 'What are the top 10 customers by revenue?',
          conversationHistory: [],
        },
        getInitData: async () => ({
          prompt: 'What are the top 10 customers by revenue?',
          conversationHistory: [],
        }),
        runtimeContext,
      });

      // Verify todos were created
      expect(result.todos).toBeTruthy();
      expect(result.todos).toContain('Determine');

      // Verify reasoning history was created
      expect(result.reasoningHistory).toBeDefined();
      expect(result.reasoningHistory).toHaveLength(1);

      const reasoningEntry = result.reasoningHistory![0];
      expect(reasoningEntry.type).toBe('files');
      expect(reasoningEntry.title).toBe('TODO List');
      expect(reasoningEntry.status).toBe('completed');

      // Verify file entry
      const fileId = reasoningEntry.file_ids[0];
      const file = reasoningEntry.files[fileId];
      expect(file.file_type).toBe('todo');
      expect(file.file_name).toBe('todos');
      expect(file.file.text).toBe(result.todos);

      // Verify database persistence
      const savedMessages = await getRawLlmMessagesByMessageId(messageId);
      expect(savedMessages).toBeTruthy();

      // The reasoning should be saved in the database
      // Note: The exact structure depends on how updateMessageFields merges the data
    });
  }, 30000);

  it('should handle step execution without messageId', async () => {
    await withTestEnv(async () => {
      // Create runtime context without messageId
      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();

      // Execute the step
      const result = await createTodosStep.execute({
        inputData: {
          prompt: 'Show me sales data',
          conversationHistory: [],
        },
        getInitData: async () => ({
          prompt: 'Show me sales data',
          conversationHistory: [],
        }),
        runtimeContext,
      });

      // Verify todos and reasoning were created
      expect(result.todos).toBeTruthy();
      expect(result.reasoningHistory).toBeDefined();
      expect(result.reasoningHistory).toHaveLength(1);

      // Without messageId, it shouldn't save to database but should still work
    });
  }, 30000);
});
