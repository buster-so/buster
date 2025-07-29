import type { PermissionedDataset } from '@buster/access-controls';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MessageContext } from '../types';
import {
  buildWorkflowInput,
  concatenateDatasets,
  formatPreviousMessages,
} from './data-transformers';

// Mock console.error to avoid noise in tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('data-transformers', () => {
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
          ymlContent: 'content1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dataSourceId: 'ds1',
          organizationId: 'org-123',
        } as PermissionedDataset,
        {
          id: '2',
          name: 'Dataset 2',
          ymlContent: 'content2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dataSourceId: 'ds2',
          organizationId: 'org-123',
        } as PermissionedDataset,
      ];

      const result = concatenateDatasets(datasets);
      expect(result).toBe('content1\n---\ncontent2');
    });

    it('should filter null ymlFile entries', () => {
      const datasets = [
        {
          id: '1',
          name: 'Dataset 1',
          ymlContent: 'content1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dataSourceId: 'ds1',
          organizationId: 'org-123',
        } as PermissionedDataset,
        {
          id: '2',
          name: 'Dataset 2',
          ymlContent: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dataSourceId: 'ds2',
          organizationId: 'org-123',
        } as PermissionedDataset,
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
          ymlContent: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dataSourceId: 'ds1',
          organizationId: 'org-123',
        } as PermissionedDataset,
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
      rawLlmMessages: [{ role: 'user', content: 'Hello' }] as any,
      userName: 'John Doe',
      organizationId: 'org-123',
    };

    const basePreviousResults: any[] = [];

    const baseDatasets: PermissionedDataset[] = [
      {
        id: '1',
        name: 'Dataset 1',
        ymlContent: 'yaml content',
        dataSourceId: 'ds1',
        organizationId: 'org-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    it('should build complete workflow input for initial message', () => {
      const result = buildWorkflowInput(
        baseMessageContext,
        basePreviousResults,
        baseDatasets,
        false
      );

      expect(result).toEqual({
        conversationHistory: [{ role: 'user', content: 'Hello' }],
        userName: 'John Doe',
        messageId: 'msg-123',
        userId: 'user-123',
        chatId: 'chat-123',
        isFollowUp: false,
        isSlackFollowUp: false,
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

      const result = buildWorkflowInput(baseMessageContext, previousResults, baseDatasets, true);

      expect(result.isFollowUp).toBe(true);
      expect(result.isSlackFollowUp).toBe(true);
      expect(result.previousMessages).toHaveLength(1);
      expect(result.previousMessages[0]).toContain('Previous assumption');
    });

    it('should handle null userName', () => {
      const messageContextWithNullUser = {
        ...baseMessageContext,
        userName: 'Unknown User',
      };

      const result = buildWorkflowInput(
        messageContextWithNullUser,
        basePreviousResults,
        baseDatasets,
        false
      );
      expect(result.userName).toBe('Unknown User');
    });

    it('should handle empty conversation history', () => {
      const messageContextNoHistory = {
        ...baseMessageContext,
        rawLlmMessages: [] as any,
      };
      const result = buildWorkflowInput(
        messageContextNoHistory,
        basePreviousResults,
        baseDatasets,
        false
      );
      expect(result.conversationHistory).toEqual([]);
    });
  });
});
