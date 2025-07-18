import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanupTestEnvironment, setupTestEnvironment } from '../../envHelpers/env-helpers';
import { createTestChat } from '../chats/createTestChat';
import { type CreateTestMessageOptions, createTestMessage } from './createTestMessage';
import { createTestMessageWithContext } from './createTestMessageWithContext';

vi.mock('../chats/createTestChat');
vi.mock('./createTestMessage');

describe('createTestMessageWithContext', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  test('creates test message with full context', async () => {
    const mockChatContext = {
      chatId: 'test-chat-id',
      organizationId: 'test-org-id',
      userId: 'test-user-id',
    };
    const mockMessageId = 'test-message-id';

    vi.mocked(createTestChat).mockResolvedValue(mockChatContext);
    vi.mocked(createTestMessage).mockResolvedValue(mockMessageId);

    const result = await createTestMessageWithContext();

    expect(result).toEqual({
      messageId: mockMessageId,
      userId: mockChatContext.userId,
      chatId: mockChatContext.chatId,
      organizationId: mockChatContext.organizationId,
    });

    expect(createTestChat).toHaveBeenCalledTimes(1);
    expect(createTestMessage).toHaveBeenCalledWith(
      mockChatContext.chatId,
      mockChatContext.userId,
      {}
    );
  });

  test('creates test message with custom options', async () => {
    const mockChatContext = {
      chatId: 'test-chat-id',
      organizationId: 'test-org-id',
      userId: 'test-user-id',
    };
    const mockMessageId = 'test-message-id';
    const options: CreateTestMessageOptions = {
      title: 'Custom Title',
      requestMessage: 'Custom request',
      isCompleted: false,
    };

    vi.mocked(createTestChat).mockResolvedValue(mockChatContext);
    vi.mocked(createTestMessage).mockResolvedValue(mockMessageId);

    const result = await createTestMessageWithContext(options);

    expect(result).toEqual({
      messageId: mockMessageId,
      userId: mockChatContext.userId,
      chatId: mockChatContext.chatId,
      organizationId: mockChatContext.organizationId,
    });

    expect(createTestChat).toHaveBeenCalledTimes(1);
    expect(createTestMessage).toHaveBeenCalledWith(
      mockChatContext.chatId,
      mockChatContext.userId,
      options
    );
  });

  test('handles createTestChat error', async () => {
    vi.mocked(createTestChat).mockRejectedValue(new Error('Chat creation failed'));

    await expect(createTestMessageWithContext()).rejects.toThrow(
      'Failed to create test message with context: Chat creation failed'
    );

    expect(createTestChat).toHaveBeenCalledTimes(1);
    expect(createTestMessage).not.toHaveBeenCalled();
  });

  test('handles createTestMessage error', async () => {
    const mockChatContext = {
      chatId: 'test-chat-id',
      organizationId: 'test-org-id',
      userId: 'test-user-id',
    };

    vi.mocked(createTestChat).mockResolvedValue(mockChatContext);
    vi.mocked(createTestMessage).mockRejectedValue(new Error('Message creation failed'));

    await expect(createTestMessageWithContext()).rejects.toThrow(
      'Failed to create test message with context: Message creation failed'
    );

    expect(createTestChat).toHaveBeenCalledTimes(1);
    expect(createTestMessage).toHaveBeenCalledWith(
      mockChatContext.chatId,
      mockChatContext.userId,
      {}
    );
  });

  test('handles unknown error', async () => {
    vi.mocked(createTestChat).mockRejectedValue('Unknown error');

    await expect(createTestMessageWithContext()).rejects.toThrow(
      'Failed to create test message with context: Unknown error'
    );
  });

  test('passes through all message options correctly', async () => {
    const mockChatContext = {
      chatId: 'test-chat-id',
      organizationId: 'test-org-id',
      userId: 'test-user-id',
    };
    const mockMessageId = 'test-message-id';
    const complexOptions: CreateTestMessageOptions = {
      title: 'Complex Title',
      requestMessage: 'Complex request message',
      responseMessages: { content: 'Complex response', metadata: { type: 'test' } },
      reasoning: { steps: ['step1', 'step2'], conclusion: 'test conclusion' },
      rawLlmMessages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ],
      finalReasoningMessage: 'Complex final reasoning',
      isCompleted: true,
      feedback: 'Complex feedback',
    };

    vi.mocked(createTestChat).mockResolvedValue(mockChatContext);
    vi.mocked(createTestMessage).mockResolvedValue(mockMessageId);

    await createTestMessageWithContext(complexOptions);

    expect(createTestMessage).toHaveBeenCalledWith(
      mockChatContext.chatId,
      mockChatContext.userId,
      complexOptions
    );
  });
});
