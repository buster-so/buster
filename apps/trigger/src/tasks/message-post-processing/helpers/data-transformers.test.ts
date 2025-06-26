import type { CoreMessage } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MessageContext } from '../types';
import {
  buildConversationHistory,
  buildWorkflowInput,
  concatenateDatasets,
  formatPreviousMessages,
} from './data-transformers';

// Mock console.error to avoid noise in tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('data-transformers', () => {
  describe('buildConversationHistory', () => {
    it('should combine multiple message arrays correctly', () => {
      const messages = [
        {
          id: '1',
          rawLlmMessages: [
            { role: 'user', content: 'Hello' } as CoreMessage,
            { role: 'assistant', content: 'Hi there' } as CoreMessage,
          ],
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
        {
          id: '2',
          rawLlmMessages: [
            { role: 'user', content: 'How are you?' } as CoreMessage,
            { role: 'assistant', content: 'I am fine' } as CoreMessage,
          ],
          createdAt: new Date('2024-01-01T00:01:00Z'),
        },
      ];

      const result = buildConversationHistory(messages);

      expect(result).toHaveLength(4);
      expect(result?.[0]).toEqual({ role: 'user', content: 'Hello' });
      expect(result?.[3]).toEqual({ role: 'assistant', content: 'I am fine' });
    });

    it('should handle empty messages array', () => {
      const result = buildConversationHistory([]);
      expect(result).toBeUndefined();
    });

    it('should skip messages with null rawLlmMessages', () => {
      const messages = [
        {
          id: '1',
          rawLlmMessages: null as any,
          createdAt: new Date(),
        },
        {
          id: '2',
          rawLlmMessages: [{ role: 'user', content: 'Test' } as CoreMessage],
          createdAt: new Date(),
        },
      ];

      const result = buildConversationHistory(messages);
      expect(result).toHaveLength(1);
      expect(result?.[0]).toEqual({ role: 'user', content: 'Test' });
    });

    it('should handle non-array rawLlmMessages gracefully', () => {
      const messages = [
        {
          id: '1',
          rawLlmMessages: 'invalid data' as any,
          createdAt: new Date(),
        },
        {
          id: '2',
          rawLlmMessages: [{ role: 'user', content: 'Valid message' } as CoreMessage],
          createdAt: new Date(),
        },
      ];

      const result = buildConversationHistory(messages);
      expect(result).toHaveLength(1);
      expect(result?.[0]).toEqual({ role: 'user', content: 'Valid message' });
    });
  });

  describe('formatPreviousMessages', () => {
    it('should extract string representation correctly', () => {
      const results = [
        {
          postProcessingMessage: { assumptions: ['Test assumption'] },
          createdAt: new Date(),
        },
        {
          postProcessingMessage: { message: 'Direct string message' },
          createdAt: new Date(),
        },
      ];

      const formatted = formatPreviousMessages(results);

      expect(formatted).toHaveLength(2);
      expect(formatted[0]).toContain('assumptions');
      expect(formatted[1]).toContain('Direct string message');
    });

    it('should handle complex nested objects', () => {
      const results = [
        {
          postProcessingMessage: {
            initial: {
              assumptions: ['Complex assumption'],
              flagForReview: true,
              nested: {
                deep: 'value',
              },
            },
          },
          createdAt: new Date(),
        },
      ];

      const formatted = formatPreviousMessages(results);
      expect(formatted[0]).toContain('Complex assumption');
      expect(formatted[0]).toContain('flagForReview');
      expect(formatted[0]).toContain('deep');
    });

    it('should return empty array for no messages', () => {
      const formatted = formatPreviousMessages([]);
      expect(formatted).toEqual([]);
    });

    it('should filter out empty strings from errors', () => {
      const results = [
        {
          postProcessingMessage: {}, // This will cause an error/empty result
          createdAt: new Date(),
        },
        {
          postProcessingMessage: { message: 'Valid message' },
          createdAt: new Date(),
        },
      ];

      const formatted = formatPreviousMessages(results);
      expect(formatted).toHaveLength(2);
      expect(formatted[1]).toContain('Valid message');
    });
  });

  describe('concatenateDatasets', () => {
    it('should join with correct separator', () => {
      const datasets = [
        {
          id: '1',
          name: 'Dataset 1',
          ymlFile: 'content1',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          dataSourceId: 'ds1',
        },
        {
          id: '2',
          name: 'Dataset 2',
          ymlFile: 'content2',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          dataSourceId: 'ds2',
        },
      ];

      const result = concatenateDatasets(datasets);
      expect(result).toBe('content1\n---\ncontent2');
    });

    it('should filter null ymlFile entries', () => {
      const datasets = [
        {
          id: '1',
          name: 'Dataset 1',
          ymlFile: 'content1',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          dataSourceId: 'ds1',
        },
        {
          id: '2',
          name: 'Dataset 2',
          ymlFile: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          dataSourceId: 'ds2',
        },
      ];

      const result = concatenateDatasets(datasets);
      expect(result).toBe('content1');
    });

    it('should return empty string for no datasets', () => {
      const result = concatenateDatasets([]);
      expect(result).toBe('');
    });

    it('should return empty string if all datasets have null ymlFile', () => {
      const datasets = [
        {
          id: '1',
          name: 'Dataset 1',
          ymlFile: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          dataSourceId: 'ds1',
        },
      ];

      const result = concatenateDatasets(datasets);
      expect(result).toBe('');
    });
  });

  describe('buildWorkflowInput', () => {
    const baseMessageContext: MessageContext = {
      id: 'msg-123',
      chatId: 'chat-123',
      createdBy: 'user-123',
      createdAt: new Date(),
      userName: 'John Doe',
      organizationId: 'org-123',
    };

    const baseConversationMessages = [
      {
        id: '1',
        rawLlmMessages: [{ role: 'user', content: 'Hello' }] as any,
        createdAt: new Date(),
      },
    ];

    const basePreviousResults: any[] = [];

    const baseDatasets = [
      {
        id: '1',
        name: 'Dataset 1',
        ymlFile: 'yaml content',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        dataSourceId: 'ds1',
      },
    ];

    it('should build complete workflow input for initial message', () => {
      const result = buildWorkflowInput(
        baseMessageContext,
        baseConversationMessages,
        basePreviousResults,
        baseDatasets
      );

      expect(result).toEqual({
        conversationHistory: [{ role: 'user', content: 'Hello' }],
        userName: 'John Doe',
        messageId: 'msg-123',
        userId: 'user-123',
        chatId: 'chat-123',
        isFollowUp: false,
        previousMessages: [],
        datasets: 'yaml content',
      });
    });

    it('should build workflow input for follow-up message', () => {
      const previousResults = [
        {
          postProcessingMessage: { assumptions: ['Previous assumption'] },
          createdAt: new Date(),
        },
      ];

      const result = buildWorkflowInput(
        baseMessageContext,
        baseConversationMessages,
        previousResults,
        baseDatasets
      );

      expect(result.isFollowUp).toBe(true);
      expect(result.previousMessages).toHaveLength(1);
      expect(result.previousMessages[0]).toContain('Previous assumption');
    });

    it('should handle null userName', () => {
      const messageContextWithNullUser = {
        ...baseMessageContext,
        userName: null,
      };

      const result = buildWorkflowInput(
        messageContextWithNullUser,
        baseConversationMessages,
        basePreviousResults,
        baseDatasets
      );
      expect(result.userName).toBe('Unknown User');
    });

    it('should handle empty conversation history', () => {
      const result = buildWorkflowInput(baseMessageContext, [], basePreviousResults, baseDatasets);
      expect(result.conversationHistory).toBeUndefined();
    });
  });
});
