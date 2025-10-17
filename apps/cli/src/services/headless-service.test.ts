import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as conversationHistory from '../utils/conversation-history';
import { runHeadlessAgent } from './headless-service';

// Mock dependencies
vi.mock('./chat-service', () => ({
  runChatAgent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../utils/conversation-history', () => ({
  loadConversation: vi.fn(),
  saveModelMessages: vi.fn().mockResolvedValue(undefined),
}));

const TEST_CHAT_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_MESSAGE_ID = '123e4567-e89b-12d3-a456-426614174001';

describe('runHeadlessAgent - contextFilePath handling', () => {
  const testDir = join(__dirname, '.test-headless');

  beforeAll(() => {
    // Create test directory and files
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });

    // Create test context files
    writeFileSync(join(testDir, 'context.txt'), 'System context from file');
    writeFileSync(
      join(testDir, 'detailed-context.txt'),
      'You are a helpful assistant. Follow these rules:\n1. Be concise\n2. Be accurate'
    );
  });

  afterAll(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock - no existing conversation
    vi.mocked(conversationHistory.loadConversation).mockResolvedValue(null);
  });

  describe('without contextFilePath', () => {
    it('should work normally without contextFilePath parameter', async () => {
      const chatId = await runHeadlessAgent({
        prompt: 'Test prompt',
        chatId: TEST_CHAT_ID,
        messageId: TEST_MESSAGE_ID,
        workingDirectory: testDir,
      });

      expect(chatId).toBe(TEST_CHAT_ID);

      // Should save messages without system message
      expect(conversationHistory.saveModelMessages).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        testDir,
        expect.arrayContaining([expect.objectContaining({ role: 'user', content: 'Test prompt' })])
      );

      // Should not have any system messages
      const savedMessages = vi.mocked(conversationHistory.saveModelMessages).mock.calls[0]?.[2];
      const systemMessages = savedMessages?.filter((m: any) => m.role === 'system');
      expect(systemMessages).toHaveLength(0);
    });

    it('should generate new chatId when not provided', async () => {
      const chatId = await runHeadlessAgent({
        prompt: 'Test prompt',
        workingDirectory: testDir,
      });

      // Should return a UUID
      expect(chatId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('with contextFilePath - absolute paths', () => {
    it('should read context file and add as system message at beginning', async () => {
      const contextPath = join(testDir, 'context.txt');

      const chatId = await runHeadlessAgent({
        prompt: 'Test prompt',
        chatId: TEST_CHAT_ID,
        messageId: TEST_MESSAGE_ID,
        workingDirectory: testDir,
        contextFilePath: contextPath,
      });

      expect(chatId).toBe(TEST_CHAT_ID);

      // Should save messages with system message first
      expect(conversationHistory.saveModelMessages).toHaveBeenCalledWith(
        TEST_CHAT_ID,
        testDir,
        expect.arrayContaining([
          expect.objectContaining({ role: 'system', content: 'System context from file' }),
          expect.objectContaining({ role: 'user', content: 'Test prompt' }),
        ])
      );

      // Verify order: system message should be first
      const savedMessages = vi.mocked(conversationHistory.saveModelMessages).mock.calls[0]?.[2];
      expect(savedMessages?.[0]).toEqual({
        role: 'system',
        content: 'System context from file',
      });
      expect(savedMessages?.[1]).toEqual({
        role: 'user',
        content: 'Test prompt',
      });
    });

    it('should handle multiline context content', async () => {
      const contextPath = join(testDir, 'detailed-context.txt');

      await runHeadlessAgent({
        prompt: 'Test prompt',
        chatId: TEST_CHAT_ID,
        workingDirectory: testDir,
        contextFilePath: contextPath,
      });

      const savedMessages = vi.mocked(conversationHistory.saveModelMessages).mock.calls[0]?.[2];
      expect(savedMessages?.[0]).toEqual({
        role: 'system',
        content: 'You are a helpful assistant. Follow these rules:\n1. Be concise\n2. Be accurate',
      });
    });
  });

  describe('with contextFilePath - relative paths', () => {
    it('should resolve relative path from working directory', async () => {
      await runHeadlessAgent({
        prompt: 'Test prompt',
        chatId: TEST_CHAT_ID,
        workingDirectory: testDir,
        contextFilePath: 'context.txt', // relative path
      });

      const savedMessages = vi.mocked(conversationHistory.saveModelMessages).mock.calls[0]?.[2];
      expect(savedMessages?.[0]).toEqual({
        role: 'system',
        content: 'System context from file',
      });
    });

    it('should resolve nested relative path', async () => {
      // Create nested directory with context file
      const nestedDir = join(testDir, 'nested');
      mkdirSync(nestedDir, { recursive: true });
      writeFileSync(join(nestedDir, 'nested-context.txt'), 'Nested context');

      await runHeadlessAgent({
        prompt: 'Test prompt',
        chatId: TEST_CHAT_ID,
        workingDirectory: testDir,
        contextFilePath: 'nested/nested-context.txt',
      });

      const savedMessages = vi.mocked(conversationHistory.saveModelMessages).mock.calls[0]?.[2];
      expect(savedMessages?.[0]).toEqual({
        role: 'system',
        content: 'Nested context',
      });
    });
  });

  describe('with contextFilePath and existing conversation', () => {
    it('should prepend system message before existing conversation messages', async () => {
      // Mock existing conversation
      vi.mocked(conversationHistory.loadConversation).mockResolvedValue({
        chatId: TEST_CHAT_ID,
        modelMessages: [
          { role: 'user', content: 'Previous message 1' },
          { role: 'assistant', content: 'Previous response 1' },
        ],
      } as any);

      const contextPath = join(testDir, 'context.txt');

      await runHeadlessAgent({
        prompt: 'New prompt',
        chatId: TEST_CHAT_ID,
        workingDirectory: testDir,
        contextFilePath: contextPath,
      });

      const savedMessages = vi.mocked(conversationHistory.saveModelMessages).mock.calls[0]?.[2];

      // Should have: system message, previous messages, new user message
      expect(savedMessages).toHaveLength(4);
      expect(savedMessages?.[0]).toEqual({
        role: 'system',
        content: 'System context from file',
      });
      expect(savedMessages?.[1]).toEqual({
        role: 'user',
        content: 'Previous message 1',
      });
      expect(savedMessages?.[2]).toEqual({
        role: 'assistant',
        content: 'Previous response 1',
      });
      expect(savedMessages?.[3]).toEqual({
        role: 'user',
        content: 'New prompt',
      });
    });
  });

  describe('error handling', () => {
    it('should throw error when context file does not exist', async () => {
      await expect(
        runHeadlessAgent({
          prompt: 'Test prompt',
          chatId: TEST_CHAT_ID,
          workingDirectory: testDir,
          contextFilePath: 'nonexistent.txt',
        })
      ).rejects.toThrow('Context file not found');
    });

    it('should throw error when context file path is invalid', async () => {
      await expect(
        runHeadlessAgent({
          prompt: 'Test prompt',
          chatId: TEST_CHAT_ID,
          workingDirectory: testDir,
          contextFilePath: '/invalid/path/to/nowhere.txt',
        })
      ).rejects.toThrow('Context file not found');
    });
  });

  describe('integration with chat service', () => {
    it('should pass context-enriched messages to runChatAgent', async () => {
      const { runChatAgent } = await import('./chat-service');
      const contextPath = join(testDir, 'context.txt');

      await runHeadlessAgent({
        prompt: 'Test prompt',
        chatId: TEST_CHAT_ID,
        messageId: TEST_MESSAGE_ID,
        workingDirectory: testDir,
        contextFilePath: contextPath,
      });

      // runChatAgent should be called with messages including system message
      expect(runChatAgent).toHaveBeenCalledWith({
        chatId: TEST_CHAT_ID,
        messageId: TEST_MESSAGE_ID,
        workingDirectory: testDir,
        isInResearchMode: undefined,
        prompt: 'Test prompt',
        messages: [
          { role: 'system', content: 'System context from file' },
          { role: 'user', content: 'Test prompt' },
        ],
      });
    });
  });
});
