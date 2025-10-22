import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as conversationHistory from '../utils/conversation-history';
import * as credentials from '../utils/credentials';
import { runChatAgent } from './chat-service';

// Mock dependencies
vi.mock('@buster/ai', () => ({
  initLogger: vi.fn(() => ({
    flush: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@buster/sdk', () => ({
  createBusterSDK: vi.fn(() => ({
    messages: {
      update: vi.fn().mockResolvedValue({ success: true }),
    },
  })),
}));

vi.mock('../handlers/agent-handler', () => ({
  executeAgent: vi.fn(() => ({
    fullStream: (async function* () {
      yield { type: 'start-step' };
      yield { type: 'text-delta', text: 'Hello' };
      yield { type: 'text-end' };
      yield { type: 'finish-step' };
    })(),
  })),
}));

vi.mock('../utils/ai-proxy', () => ({
  getProxyConfig: vi.fn().mockResolvedValue({
    apiUrl: 'http://localhost:8080',
    apiKey: 'test-key',
  }),
}));

vi.mock('../utils/conversation-history', () => ({
  saveModelMessages: vi.fn(),
}));

vi.mock('../utils/credentials', () => ({
  getCredentials: vi.fn(),
}));

vi.mock('../utils/sdk-factory', () => ({
  getOrCreateSdk: vi.fn(),
  createAuthenticatedSdk: vi.fn(),
  clearCachedSdk: vi.fn(),
}));

vi.mock('../utils/debug-logger', () => ({
  debugLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  enableDebugLogging: vi.fn(),
  isDebugEnabled: vi.fn(),
}));

// Test UUIDs
const TEST_CHAT_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_MESSAGE_ID = '123e4567-e89b-12d3-a456-426614174001';
const TEST_CHAT_ID_2 = '223e4567-e89b-12d3-a456-426614174002';
const TEST_MESSAGE_ID_2 = '223e4567-e89b-12d3-a456-426614174003';

describe('runChatAgent - API-first refactoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(conversationHistory.saveModelMessages).mockResolvedValue();
    vi.mocked(credentials.getCredentials).mockResolvedValue({
      apiKey: 'test-api-key',
      apiUrl: 'https://api.test.com',
    });
  });

  it('should NOT save to local files when SDK is provided', async () => {
    const { createBusterSDK } = await import('@buster/sdk');
    const mockCreate = vi.fn().mockResolvedValue({ success: true });
    const mockUpdate = vi.fn().mockResolvedValue({ success: true });
    const mockSdk = {
      messages: { create: mockCreate, update: mockUpdate },
    };

    await runChatAgent({
      chatId: TEST_CHAT_ID,
      messageId: TEST_MESSAGE_ID,
      workingDirectory: '/tmp/test',
      messages: [{ role: 'user', content: 'Test' }],
      sdk: mockSdk as any,
    });

    // Should NOT call saveModelMessages when SDK is provided
    expect(conversationHistory.saveModelMessages).not.toHaveBeenCalled();

    // Should create and update via SDK
    expect(mockCreate).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('should use SDK parameter for all API operations', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ success: true });
    const mockUpdate = vi.fn().mockResolvedValue({ success: true });
    const mockSdk = {
      messages: { create: mockCreate, update: mockUpdate },
    };

    await runChatAgent({
      chatId: TEST_CHAT_ID,
      messageId: TEST_MESSAGE_ID,
      workingDirectory: '/tmp/test',
      messages: [{ role: 'user', content: 'Test prompt' }],
      sdk: mockSdk as any,
    });

    // Should use the provided SDK, not create a new one
    const { createBusterSDK } = await import('@buster/sdk');
    expect(createBusterSDK).not.toHaveBeenCalled();

    // Should use provided SDK for create
    expect(mockCreate).toHaveBeenCalledWith(TEST_CHAT_ID, TEST_MESSAGE_ID, {
      prompt: 'Test prompt',
    });

    // Should use provided SDK for updates
    expect(mockUpdate).toHaveBeenCalledWith(TEST_CHAT_ID, TEST_MESSAGE_ID, {
      rawLlmMessages: expect.any(Array),
    });

    // Should mark as completed using provided SDK
    expect(mockUpdate).toHaveBeenCalledWith(TEST_CHAT_ID, TEST_MESSAGE_ID, {
      isCompleted: true,
    });
  });

  it('should handle API failures gracefully without local fallback', async () => {
    const mockCreate = vi.fn().mockRejectedValue(new Error('API error'));
    const mockUpdate = vi.fn().mockResolvedValue({ success: true });
    const mockSdk = {
      messages: { create: mockCreate, update: mockUpdate },
    };

    const { debugLogger } = await import('../utils/debug-logger');

    // Should not throw, should continue execution
    await runChatAgent({
      chatId: TEST_CHAT_ID,
      messageId: TEST_MESSAGE_ID,
      workingDirectory: '/tmp/test',
      messages: [{ role: 'user', content: 'Test' }],
      sdk: mockSdk as any,
    });

    // Should log warning but NOT save to local files
    expect(debugLogger.warn).toHaveBeenCalledWith(
      'Failed to create message in database:',
      expect.any(Error)
    );
    expect(conversationHistory.saveModelMessages).not.toHaveBeenCalled();
  });
});

describe('runChatAgent - message updates', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(conversationHistory.saveModelMessages).mockResolvedValue();
    vi.mocked(credentials.getCredentials).mockResolvedValue({
      apiKey: 'test-api-key',
      apiUrl: 'https://api.test.com',
    });

    // Setup SDK factory to return mocked SDK
    const { getOrCreateSdk } = await import('../utils/sdk-factory');
    vi.mocked(getOrCreateSdk).mockImplementation(async () => {
      const { createBusterSDK } = await import('@buster/sdk');
      return vi.mocked(createBusterSDK)({ apiKey: 'test', apiUrl: 'http://test' }) as any;
    });
  });

  describe('SDK initialization', () => {
    it('should call getOrCreateSdk when SDK not provided', async () => {
      const { getOrCreateSdk } = await import('../utils/sdk-factory');
      const mockCreate = vi.fn().mockResolvedValue({ success: true });
      const mockUpdate = vi.fn().mockResolvedValue({ success: true });

      vi.mocked(getOrCreateSdk).mockResolvedValue({
        messages: { create: mockCreate, update: mockUpdate },
      } as any);

      await runChatAgent({
        chatId: TEST_CHAT_ID,
        messageId: TEST_MESSAGE_ID,
        workingDirectory: '/tmp/test',
        messages: [],
      });

      expect(getOrCreateSdk).toHaveBeenCalled();
    });

    it('should auto-generate messageId and call getOrCreateSdk', async () => {
      const { getOrCreateSdk } = await import('../utils/sdk-factory');
      const mockCreate = vi.fn().mockResolvedValue({ success: true });
      const mockUpdate = vi.fn().mockResolvedValue({ success: true });

      vi.mocked(getOrCreateSdk).mockResolvedValue({
        messages: { create: mockCreate, update: mockUpdate },
      } as any);

      await runChatAgent({
        chatId: TEST_CHAT_ID,
        workingDirectory: '/tmp/test',
        messages: [],
      });

      // Should call getOrCreateSdk even when messageId is auto-generated
      expect(getOrCreateSdk).toHaveBeenCalled();
    });

    it('should handle getOrCreateSdk failure gracefully', async () => {
      const { getOrCreateSdk } = await import('../utils/sdk-factory');
      vi.mocked(getOrCreateSdk).mockRejectedValue(new Error('No credentials'));

      const { debugLogger } = await import('../utils/debug-logger');

      // Should not throw
      await expect(
        runChatAgent({
          chatId: TEST_CHAT_ID,
          messageId: TEST_MESSAGE_ID,
          workingDirectory: '/tmp/test',
          messages: [],
        })
      ).resolves.not.toThrow();

      // Should log warning
      expect(debugLogger.warn).toHaveBeenCalledWith(
        'No SDK available - running without API integration:',
        expect.any(Error)
      );
    });
  });

  describe('message updates during streaming', () => {
    it('should create message upfront and update during streaming', async () => {
      const { createBusterSDK } = await import('@buster/sdk');
      const mockCreate = vi
        .fn()
        .mockResolvedValue({ success: true, chatId: TEST_CHAT_ID, messageId: TEST_MESSAGE_ID });
      const mockUpdate = vi.fn().mockResolvedValue({ success: true });
      vi.mocked(createBusterSDK).mockReturnValue({
        messages: { create: mockCreate, update: mockUpdate },
      } as any);

      await runChatAgent({
        chatId: TEST_CHAT_ID,
        messageId: TEST_MESSAGE_ID,
        workingDirectory: '/tmp/test',
        messages: [{ role: 'user', content: 'Test prompt' }],
      });

      // Should have created message upfront before agent execution
      expect(mockCreate).toHaveBeenCalledWith(TEST_CHAT_ID, TEST_MESSAGE_ID, {
        prompt: 'Test prompt',
      });

      // Should have saved messages to disk during streaming
      expect(conversationHistory.saveModelMessages).toHaveBeenCalled();

      // Should have updated rawLlmMessages via SDK during streaming
      expect(mockUpdate).toHaveBeenCalledWith(TEST_CHAT_ID, TEST_MESSAGE_ID, {
        rawLlmMessages: expect.any(Array),
      });
    });

    it('should continue even if SDK create fails upfront', async () => {
      const { createBusterSDK } = await import('@buster/sdk');
      const mockCreate = vi.fn().mockRejectedValue(new Error('API error'));
      const mockUpdate = vi.fn().mockResolvedValue({ success: true });
      vi.mocked(createBusterSDK).mockReturnValue({
        messages: { create: mockCreate, update: mockUpdate },
      } as any);

      const { debugLogger } = await import('../utils/debug-logger');

      await runChatAgent({
        chatId: TEST_CHAT_ID,
        messageId: TEST_MESSAGE_ID,
        workingDirectory: '/tmp/test',
        messages: [{ role: 'user', content: 'Test prompt' }],
      });

      // Should have still saved to disk
      expect(conversationHistory.saveModelMessages).toHaveBeenCalled();

      // Should have logged warning for create failure
      expect(debugLogger.warn).toHaveBeenCalledWith(
        'Failed to create message in database:',
        expect.any(Error)
      );
    });

    it('should call SDK create and update with auto-generated messageId when not provided', async () => {
      const { createBusterSDK } = await import('@buster/sdk');
      const mockCreate = vi.fn().mockResolvedValue({ success: true });
      const mockUpdate = vi.fn().mockResolvedValue({ success: true });
      vi.mocked(createBusterSDK).mockReturnValue({
        messages: { create: mockCreate, update: mockUpdate },
      } as any);

      await runChatAgent({
        chatId: TEST_CHAT_ID,
        workingDirectory: '/tmp/test',
        messages: [{ role: 'user', content: 'Test prompt' }],
      });

      // Should save to disk
      expect(conversationHistory.saveModelMessages).toHaveBeenCalled();

      // Should call SDK create with auto-generated messageId
      expect(mockCreate).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.any(String), // auto-generated UUID
        {
          prompt: 'Test prompt',
        }
      );

      // Should call SDK update with auto-generated messageId
      expect(mockUpdate).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.any(String), // auto-generated UUID
        {
          rawLlmMessages: expect.any(Array),
        }
      );
    });
  });

  describe('completion marking', () => {
    it('should mark message as completed when agent finishes successfully', async () => {
      const { createBusterSDK } = await import('@buster/sdk');
      const mockCreate = vi.fn().mockResolvedValue({ success: true });
      const mockUpdate = vi.fn().mockResolvedValue({ success: true });
      vi.mocked(createBusterSDK).mockReturnValue({
        messages: { create: mockCreate, update: mockUpdate },
      } as any);

      await runChatAgent({
        chatId: TEST_CHAT_ID_2,
        messageId: TEST_MESSAGE_ID_2,
        workingDirectory: '/tmp/test',
        messages: [],
      });

      // Should have marked as completed
      expect(mockUpdate).toHaveBeenCalledWith(TEST_CHAT_ID_2, TEST_MESSAGE_ID_2, {
        isCompleted: true,
      });
    });

    it('should mark as completed even with auto-generated messageId', async () => {
      const { createBusterSDK } = await import('@buster/sdk');
      const mockCreate = vi.fn().mockResolvedValue({ success: true });
      const mockUpdate = vi.fn().mockResolvedValue({ success: true });
      vi.mocked(createBusterSDK).mockReturnValue({
        messages: { create: mockCreate, update: mockUpdate },
      } as any);

      await runChatAgent({
        chatId: TEST_CHAT_ID,
        workingDirectory: '/tmp/test',
        messages: [],
      });

      // Should have marked as completed with auto-generated messageId
      expect(mockUpdate).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        expect.any(String), // auto-generated UUID
        {
          isCompleted: true,
        }
      );
    });

    it('should handle completion marking failure gracefully', async () => {
      const { createBusterSDK } = await import('@buster/sdk');
      const mockCreate = vi.fn().mockResolvedValue({ success: true });
      // Mock to succeed on update calls during streaming
      // and fail on final isCompleted call
      const mockUpdate = vi.fn();
      let callCount = 0;
      mockUpdate.mockImplementation((chatId, messageId, data) => {
        callCount++;
        if ('rawLlmMessages' in data) {
          // rawLlmMessages updates - succeed
          return Promise.resolve({ success: true });
        }
        // isCompleted update - fail
        return Promise.reject(new Error('Completion marking failed'));
      });

      vi.mocked(createBusterSDK).mockReturnValue({
        messages: { create: mockCreate, update: mockUpdate },
      } as any);

      const { debugLogger } = await import('../utils/debug-logger');

      // Should not throw
      await expect(
        runChatAgent({
          chatId: TEST_CHAT_ID,
          messageId: TEST_MESSAGE_ID,
          workingDirectory: '/tmp/test',
          messages: [],
        })
      ).resolves.not.toThrow();

      // Should have logged warning for completion marking failure
      expect(debugLogger.warn).toHaveBeenCalledWith(
        'Failed to mark message as completed:',
        expect.any(Error)
      );
    });
  });

  describe('message persistence', () => {
    it('should save messages to disk before updating database', async () => {
      const { createBusterSDK } = await import('@buster/sdk');
      const mockCreate = vi.fn().mockResolvedValue({ success: true });
      const mockUpdate = vi.fn().mockResolvedValue({ success: true });
      vi.mocked(createBusterSDK).mockReturnValue({
        messages: { create: mockCreate, update: mockUpdate },
      } as any);

      const callOrder: string[] = [];

      vi.mocked(conversationHistory.saveModelMessages).mockImplementation(async () => {
        callOrder.push('disk');
      });

      mockUpdate.mockImplementation(async () => {
        callOrder.push('api');
        return { success: true };
      });

      await runChatAgent({
        chatId: TEST_CHAT_ID,
        messageId: TEST_MESSAGE_ID,
        workingDirectory: '/tmp/test',
        messages: [],
      });

      // Disk save should come before API update
      expect(callOrder[0]).toBe('disk');
      expect(callOrder[1]).toBe('api');
    });

    it('should save correct message data to disk', async () => {
      const { createBusterSDK } = await import('@buster/sdk');
      const mockCreate = vi.fn().mockResolvedValue({ success: true });
      const mockUpdate = vi.fn().mockResolvedValue({ success: true });
      vi.mocked(createBusterSDK).mockReturnValue({
        messages: { create: mockCreate, update: mockUpdate },
      } as any);

      await runChatAgent({
        chatId: TEST_CHAT_ID,
        messageId: TEST_MESSAGE_ID,
        workingDirectory: '/tmp/test-dir',
        messages: [],
      });

      expect(conversationHistory.saveModelMessages).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        '/tmp/test-dir',
        expect.any(Array)
      );
    });
  });

  describe('callbacks', () => {
    it('should call onMessageUpdate callback with messages', async () => {
      const { createBusterSDK } = await import('@buster/sdk');
      const mockCreate = vi.fn().mockResolvedValue({ success: true });
      const mockUpdate = vi.fn().mockResolvedValue({ success: true });
      vi.mocked(createBusterSDK).mockReturnValue({
        messages: { create: mockCreate, update: mockUpdate },
      } as any);

      const onMessageUpdate = vi.fn();

      await runChatAgent(
        {
          chatId: TEST_CHAT_ID,
          messageId: TEST_MESSAGE_ID,
          workingDirectory: '/tmp/test',
          messages: [],
        },
        { onMessageUpdate }
      );

      expect(onMessageUpdate).toHaveBeenCalled();
      expect(onMessageUpdate).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should call onThinkingStateChange callbacks', async () => {
      const { createBusterSDK } = await import('@buster/sdk');
      const mockCreate = vi.fn().mockResolvedValue({ success: true });
      const mockUpdate = vi.fn().mockResolvedValue({ success: true });
      vi.mocked(createBusterSDK).mockReturnValue({
        messages: { create: mockCreate, update: mockUpdate },
      } as any);

      const onThinkingStateChange = vi.fn();

      await runChatAgent(
        {
          chatId: TEST_CHAT_ID,
          messageId: TEST_MESSAGE_ID,
          workingDirectory: '/tmp/test',
          messages: [],
        },
        { onThinkingStateChange }
      );

      // Should be called with true at start and false at end
      expect(onThinkingStateChange).toHaveBeenCalledWith(true);
      expect(onThinkingStateChange).toHaveBeenCalledWith(false);
    });
  });

  describe('error handling', () => {
    it('should flush braintrust logger even on error', async () => {
      const { initLogger } = await import('@buster/ai');
      const mockFlush = vi.fn().mockResolvedValue(undefined);
      vi.mocked(initLogger).mockReturnValue({
        flush: mockFlush,
      } as any);

      // Make agent execution fail
      const { executeAgent } = await import('../handlers/agent-handler');
      vi.mocked(executeAgent).mockRejectedValue(new Error('Agent failed'));

      await expect(
        runChatAgent({
          chatId: TEST_CHAT_ID,
          messageId: TEST_MESSAGE_ID,
          workingDirectory: '/tmp/test',
          messages: [],
        })
      ).rejects.toThrow('Agent failed');

      // Logger should still be flushed
      expect(mockFlush).toHaveBeenCalled();
    });
  });

  describe('contextFilePath handling', () => {
    const { existsSync, mkdirSync, rmSync, writeFileSync } = require('node:fs');
    const { join } = require('node:path');

    const testDir = join(__dirname, '.test-chat-context');

    beforeEach(async () => {
      // Reset all mocks
      vi.clearAllMocks();

      // Re-setup the default mock for executeAgent
      const { executeAgent } = await import('../handlers/agent-handler');
      vi.mocked(executeAgent).mockResolvedValue({
        fullStream: (async function* () {
          yield { type: 'start-step' };
          yield { type: 'text-delta', text: 'Hello' };
          yield { type: 'text-end' };
          yield { type: 'finish-step' };
        })(),
      } as any);

      // Create test directory and files
      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true });
      }
      mkdirSync(testDir, { recursive: true });

      writeFileSync(join(testDir, 'context.txt'), 'System instructions from file');
    });

    afterEach(() => {
      // Clean up test directory
      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true });
      }
    });

    it('should prepend system message when contextFilePath is provided', async () => {
      const { createBusterSDK } = await import('@buster/sdk');
      const mockCreate = vi.fn().mockResolvedValue({ success: true });
      const mockUpdate = vi.fn().mockResolvedValue({ success: true });
      vi.mocked(createBusterSDK).mockReturnValue({
        messages: { create: mockCreate, update: mockUpdate },
      } as any);

      const { executeAgent } = await import('../handlers/agent-handler');

      const contextPath = join(testDir, 'context.txt');

      await runChatAgent({
        chatId: TEST_CHAT_ID,
        messageId: TEST_MESSAGE_ID,
        workingDirectory: testDir,
        messages: [{ role: 'user', content: 'Test prompt' }],
        contextFilePath: contextPath,
      });

      // executeAgent should be called with messages including system message at the beginning
      expect(executeAgent).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expect.arrayContaining([
          expect.objectContaining({ role: 'system', content: 'System instructions from file' }),
          expect.objectContaining({ role: 'user', content: 'Test prompt' }),
        ])
      );

      // Verify order - system message should be first
      const callArgs = vi.mocked(executeAgent).mock.calls[0];
      const messages = callArgs?.[2];
      expect(messages).toBeDefined();
      expect(messages?.[0]).toEqual({ role: 'system', content: 'System instructions from file' });
      expect(messages?.[1]).toEqual({ role: 'user', content: 'Test prompt' });
    });

    it('should work with relative contextFilePath', async () => {
      const { createBusterSDK } = await import('@buster/sdk');
      const mockCreate = vi.fn().mockResolvedValue({ success: true });
      const mockUpdate = vi.fn().mockResolvedValue({ success: true });
      vi.mocked(createBusterSDK).mockReturnValue({
        messages: { create: mockCreate, update: mockUpdate },
      } as any);

      const { executeAgent } = await import('../handlers/agent-handler');

      await runChatAgent({
        chatId: TEST_CHAT_ID,
        messageId: TEST_MESSAGE_ID,
        workingDirectory: testDir,
        messages: [{ role: 'user', content: 'Test prompt' }],
        contextFilePath: 'context.txt', // relative path
      });

      const callArgs = vi.mocked(executeAgent).mock.calls[0];
      const messages = callArgs?.[2];
      expect(messages).toBeDefined();
      expect(messages?.[0]).toEqual({ role: 'system', content: 'System instructions from file' });
    });

    it('should work without contextFilePath', async () => {
      const { createBusterSDK } = await import('@buster/sdk');
      const mockCreate = vi.fn().mockResolvedValue({ success: true });
      const mockUpdate = vi.fn().mockResolvedValue({ success: true });
      vi.mocked(createBusterSDK).mockReturnValue({
        messages: { create: mockCreate, update: mockUpdate },
      } as any);

      const { executeAgent } = await import('../handlers/agent-handler');

      await runChatAgent({
        chatId: TEST_CHAT_ID,
        messageId: TEST_MESSAGE_ID,
        workingDirectory: testDir,
        messages: [{ role: 'user', content: 'Test prompt' }],
      });

      const callArgs = vi.mocked(executeAgent).mock.calls[0];
      const messages = callArgs?.[2];

      // Should not have system message
      expect(messages).toBeDefined();
      const systemMessages = messages?.filter((m: any) => m.role === 'system');
      expect(systemMessages).toHaveLength(0);
    });

    it('should prepend system message before existing messages', async () => {
      const { createBusterSDK } = await import('@buster/sdk');
      const mockCreate = vi.fn().mockResolvedValue({ success: true });
      const mockUpdate = vi.fn().mockResolvedValue({ success: true });
      vi.mocked(createBusterSDK).mockReturnValue({
        messages: { create: mockCreate, update: mockUpdate },
      } as any);

      const { executeAgent } = await import('../handlers/agent-handler');

      const contextPath = join(testDir, 'context.txt');

      await runChatAgent({
        chatId: TEST_CHAT_ID,
        messageId: TEST_MESSAGE_ID,
        workingDirectory: testDir,
        messages: [
          { role: 'user', content: 'First message' },
          { role: 'assistant', content: 'First response' },
          { role: 'user', content: 'Second message' },
        ],
        contextFilePath: contextPath,
      });

      const callArgs = vi.mocked(executeAgent).mock.calls[0];
      const messages = callArgs?.[2];

      // Should have 4 messages: system + 3 original
      expect(messages).toBeDefined();
      expect(messages).toHaveLength(4);
      expect(messages?.[0]).toEqual({ role: 'system', content: 'System instructions from file' });
      expect(messages?.[1]).toEqual({ role: 'user', content: 'First message' });
      expect(messages?.[2]).toEqual({ role: 'assistant', content: 'First response' });
      expect(messages?.[3]).toEqual({ role: 'user', content: 'Second message' });
    });

    it('should throw error when context file does not exist', async () => {
      const { createBusterSDK } = await import('@buster/sdk');
      const mockCreate = vi.fn().mockResolvedValue({ success: true });
      const mockUpdate = vi.fn().mockResolvedValue({ success: true });
      vi.mocked(createBusterSDK).mockReturnValue({
        messages: { create: mockCreate, update: mockUpdate },
      } as any);

      await expect(
        runChatAgent({
          chatId: TEST_CHAT_ID,
          messageId: TEST_MESSAGE_ID,
          workingDirectory: testDir,
          messages: [{ role: 'user', content: 'Test prompt' }],
          contextFilePath: 'nonexistent.txt',
        })
      ).rejects.toThrow('Context file not found');
    });
  });
});
