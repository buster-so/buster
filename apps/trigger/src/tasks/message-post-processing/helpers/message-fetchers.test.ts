import * as accessControls from '@buster/access-controls';
import * as database from '@buster/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataFetchError, MessageNotFoundError } from '../types';
import {
  fetchMessageWithContext,
  fetchPreviousPostProcessingMessages,
  fetchUserDatasets,
} from './message-fetchers';

// Mock the database module
vi.mock('@buster/database', () => ({
  getDb: vi.fn(),
  and: vi.fn((...args) => ({ type: 'and', args })),
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
  lt: vi.fn((a, b) => ({ type: 'lt', a, b })),
  lte: vi.fn((a, b) => ({ type: 'lte', a, b })),
  isNull: vi.fn((a) => ({ type: 'isNull', a })),
  isNotNull: vi.fn((a) => ({ type: 'isNotNull', a })),
  messages: {
    id: 'messages.id',
    chatId: 'messages.chatId',
    createdBy: 'messages.createdBy',
    createdAt: 'messages.createdAt',
    postProcessingMessage: 'messages.postProcessingMessage',
    deletedAt: 'messages.deletedAt',
    rawLlmMessages: 'messages.rawLlmMessages',
  },
  chats: { id: 'chats.id', organizationId: 'chats.organizationId' },
  users: { id: 'users.id', name: 'users.name' },
}));

// Mock access controls
vi.mock('@buster/access-controls', () => ({
  getPermissionedDatasets: vi.fn(),
}));

describe('message-fetchers', () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn(),
      limit: vi.fn(),
    };

    // Set up the mock chain to return itself for most methods
    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.innerJoin.mockReturnValue(mockDb);
    mockDb.leftJoin.mockReturnValue(mockDb);
    mockDb.where.mockReturnValue(mockDb);

    vi.mocked(database.getDb).mockReturnValue(mockDb);
  });

  describe('fetchMessageWithContext', () => {
    it('should return message with user and chat data', async () => {
      const messageData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        chatId: '223e4567-e89b-12d3-a456-426614174000',
        createdBy: '323e4567-e89b-12d3-a456-426614174000',
        createdAt: '2024-01-01T00:00:00Z',
        rawLlmMessages: [{ role: 'user', content: 'Test message' }],
        userName: 'John Doe',
        organizationId: '423e4567-e89b-12d3-a456-426614174000',
      };

      mockDb.limit.mockResolvedValue([messageData]);

      const result = await fetchMessageWithContext(messageData.id);

      expect(result).toEqual({
        id: messageData.id,
        chatId: messageData.chatId,
        createdBy: messageData.createdBy,
        createdAt: new Date(messageData.createdAt),
        rawLlmMessages: messageData.rawLlmMessages,
        userName: messageData.userName,
        organizationId: messageData.organizationId,
      });

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
    });

    it('should throw MessageNotFoundError when message not found', async () => {
      mockDb.limit.mockResolvedValue([]);

      await expect(fetchMessageWithContext('non-existent-id')).rejects.toThrow(
        MessageNotFoundError
      );
    });

    it('should handle null user name', async () => {
      const messageData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        chatId: '223e4567-e89b-12d3-a456-426614174000',
        createdBy: '323e4567-e89b-12d3-a456-426614174000',
        createdAt: '2024-01-01T00:00:00Z',
        rawLlmMessages: [{ role: 'user', content: 'Test' }],
        userName: null,
        organizationId: '423e4567-e89b-12d3-a456-426614174000',
      };

      mockDb.limit.mockResolvedValue([messageData]);

      const result = await fetchMessageWithContext(messageData.id);
      expect(result.userName).toBe('Unknown');
    });

    it('should wrap database errors in DataFetchError', async () => {
      const dbError = new Error('Database connection failed');
      mockDb.limit.mockRejectedValue(dbError);

      await expect(fetchMessageWithContext('123')).rejects.toThrow(DataFetchError);
    });
  });

  describe('fetchPreviousPostProcessingMessages', () => {
    const beforeTimestamp = new Date('2024-01-01T12:00:00Z');

    it('should return only messages with postProcessingMessage', async () => {
      const messages = [
        {
          postProcessingMessage: { assumptions: ['test'] },
          createdAt: '2024-01-01T10:00:00Z',
        },
        {
          postProcessingMessage: { followUp: { suggestions: ['ask more'] } },
          createdAt: '2024-01-01T11:00:00Z',
        },
      ];

      mockDb.orderBy.mockReturnValue(mockDb);
      mockDb.orderBy.mockResolvedValueOnce(messages);

      const result = await fetchPreviousPostProcessingMessages('chat-id', beforeTimestamp);

      expect(result).toHaveLength(2);
      expect(result[0]?.postProcessingMessage).toHaveProperty('assumptions');
      expect(result[1]?.postProcessingMessage).toHaveProperty('followUp');
    });

    it('should order by createdAt ascending', async () => {
      const messages = [
        {
          postProcessingMessage: { id: 1 },
          createdAt: '2024-01-01T10:00:00Z',
        },
        {
          postProcessingMessage: { id: 2 },
          createdAt: '2024-01-01T11:00:00Z',
        },
      ];

      mockDb.orderBy.mockReturnValue(mockDb);
      mockDb.orderBy.mockResolvedValueOnce(messages);

      const result = await fetchPreviousPostProcessingMessages('chat-id', beforeTimestamp);

      expect(result[0]!.createdAt < result[1]!.createdAt).toBe(true);
    });

    it('should return empty array when no results', async () => {
      mockDb.orderBy.mockReturnValue(mockDb);
      mockDb.orderBy.mockResolvedValueOnce([]);

      const result = await fetchPreviousPostProcessingMessages('chat-id', beforeTimestamp);
      expect(result).toEqual([]);
    });
  });

  describe('fetchUserDatasets', () => {
    it('should return datasets with non-null ymlFile', async () => {
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

      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValue({
        datasets: datasets as any,
        total: datasets.length,
        page: 0,
        pageSize: 1000,
      });

      const result = await fetchUserDatasets('user-id');

      expect(result).toEqual({
        datasets: datasets,
        total: datasets.length,
        page: 0,
        pageSize: 1000,
      });
      expect(accessControls.getPermissionedDatasets).toHaveBeenCalledWith({
        userId: 'user-id',
        page: 0,
        pageSize: 1000,
      });
    });

    it('should handle empty dataset list', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValue({
        datasets: [],
        total: 0,
        page: 0,
        pageSize: 1000,
      });

      const result = await fetchUserDatasets('user-id');
      expect(result).toEqual({
        datasets: [],
        total: 0,
        page: 0,
        pageSize: 1000,
      });
    });

    it('should wrap errors in DataFetchError', async () => {
      const error = new Error('Access denied');
      vi.mocked(accessControls.getPermissionedDatasets).mockRejectedValue(error);

      await expect(fetchUserDatasets('user-id')).rejects.toThrow(DataFetchError);
    });
  });
});
