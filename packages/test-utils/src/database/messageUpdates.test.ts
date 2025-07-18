import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanupTestEnvironment, setupTestEnvironment } from '../envHelpers/env-helpers';

const mockCreateTestMessageWithContext = vi.fn();

vi.mock('./messages/createTestMessageWithContext', () => ({
  createTestMessageWithContext: mockCreateTestMessageWithContext,
}));

describe('Message Updates Test Helpers - Unit Tests', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  test('createTestMessageWithContext provides context for message reasoning updates', async () => {
    const mockResult = {
      messageId: 'test-message-id',
      userId: 'test-user-id',
      chatId: 'test-chat-id',
      organizationId: 'test-org-id',
    };

    mockCreateTestMessageWithContext.mockResolvedValue(mockResult);

    const { createTestMessageWithContext } = await import(
      './messages/createTestMessageWithContext'
    );
    const result = await createTestMessageWithContext({
      reasoning: { steps: ['Initial step'], conclusion: 'Test conclusion' },
    });

    expect(result).toEqual(mockResult);
    expect(mockCreateTestMessageWithContext).toHaveBeenCalledWith({
      reasoning: { steps: ['Initial step'], conclusion: 'Test conclusion' },
    });
  });

  test('createTestMessageWithContext provides context for streaming field updates', async () => {
    const mockResult = {
      messageId: 'test-message-id',
      userId: 'test-user-id',
      chatId: 'test-chat-id',
      organizationId: 'test-org-id',
    };

    mockCreateTestMessageWithContext.mockResolvedValue(mockResult);

    const { createTestMessageWithContext } = await import(
      './messages/createTestMessageWithContext'
    );
    const result = await createTestMessageWithContext({
      responseMessages: { content: 'Streaming response', metadata: { streaming: true } },
    });

    expect(result).toEqual(mockResult);
    expect(mockCreateTestMessageWithContext).toHaveBeenCalledWith({
      responseMessages: { content: 'Streaming response', metadata: { streaming: true } },
    });
  });

  test('createTestMessageWithContext can create messages with raw LLM messages', async () => {
    const rawLlmMessages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ];

    const mockResult = {
      messageId: 'test-message-id',
      userId: 'test-user-id',
      chatId: 'test-chat-id',
      organizationId: 'test-org-id',
    };

    mockCreateTestMessageWithContext.mockResolvedValue(mockResult);

    const { createTestMessageWithContext } = await import(
      './messages/createTestMessageWithContext'
    );
    const result = await createTestMessageWithContext({
      rawLlmMessages,
      requestMessage: 'Hello',
    });

    expect(result).toEqual(mockResult);
    expect(mockCreateTestMessageWithContext).toHaveBeenCalledWith({
      rawLlmMessages,
      requestMessage: 'Hello',
    });
  });
});
