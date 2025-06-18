import { createTestChat, createTestMessage, withTestEnv } from '@buster/test-utils';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTodosStep } from '../../../src/steps/create-todos-step';
import { getRawLlmMessagesByMessageId } from '../../../src/steps/get-chat-history';
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
      const messageId = await createTestMessage(chatId, userId, {
        requestMessage: 'What are the top 10 customers by revenue?',
      });

      // Create runtime context with messageId
      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('messageId', messageId);

      // Execute the step using the proper context
      const result = await createTodosStep.execute({
        inputData: {
          prompt: 'What are the top 10 customers by revenue?',
          conversationHistory: [],
        },
        runtimeContext,
      } as any);

      // Verify todos were created
      expect(result.todos).toBeTruthy();
      expect(result.todos).toContain('Determine');

      // Verify reasoning history was created
      expect(result.reasoningHistory).toBeDefined();
      expect(result.reasoningHistory).toHaveLength(1);
      if (!result.reasoningHistory || result.reasoningHistory.length === 0) {
        throw new Error('Expected reasoning history to have at least one entry');
      }

      const reasoningEntry = result.reasoningHistory[0]!;
      expect(reasoningEntry.type).toBe('files');
      expect(reasoningEntry.title).toBe('TODO List');
      expect(reasoningEntry.status).toBe('completed');

      // Verify file entry
      interface FileReasoningEntry {
        type: string;
        title: string;
        status: string;
        file_ids?: string[];
        files?: Record<
          string,
          {
            file_type: string;
            file_name: string;
            file: { text: string };
          }
        >;
      }

      const fileReasoningEntry = reasoningEntry as FileReasoningEntry;
      const fileId = fileReasoningEntry.file_ids?.[0];
      if (!fileId) {
        throw new Error('Expected file ID to be defined');
      }
      const file = fileReasoningEntry.files?.[fileId];
      if (!file) {
        throw new Error('Expected file to be defined');
      }
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

      // Execute the step using the proper context
      const result = await createTodosStep.execute({
        inputData: {
          prompt: 'Show me sales data',
          conversationHistory: [],
        },
        runtimeContext,
      } as any);

      // Verify todos and reasoning were created
      expect(result.todos).toBeTruthy();
      expect(result.reasoningHistory).toBeDefined();
      expect(result.reasoningHistory).toHaveLength(1);

      // Without messageId, it shouldn't save to database but should still work
    });
  }, 30000);
});
