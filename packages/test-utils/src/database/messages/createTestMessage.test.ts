import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanupTestEnvironment, setupTestEnvironment } from '../../envHelpers/env-helpers';
import { type CreateTestMessageOptions, createTestMessage } from './createTestMessage';

vi.mock('@buster/database', () => {
  const mockValues = vi.fn().mockResolvedValue(undefined);
  const mockInsert = vi.fn().mockReturnValue({
    values: mockValues,
  });
  const mockMessages = {};

  return {
    db: {
      insert: mockInsert,
    },
    messages: mockMessages,
    mockValues,
    mockInsert,
    mockMessages,
  };
});

describe('createTestMessage', () => {
  let mockValues: any;
  let mockInsert: any;
  let mockMessages: any;

  beforeEach(async () => {
    await setupTestEnvironment();
    vi.clearAllMocks();

    const dbMock = (await vi.importMock('@buster/database')) as any;
    mockValues = dbMock.mockValues;
    mockInsert = dbMock.mockInsert;
    mockMessages = dbMock.mockMessages;

    mockValues.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  test('creates test message with default values', async () => {
    const chatId = 'test-chat-id';
    const createdBy = 'test-user-id';

    const messageId = await createTestMessage(chatId, createdBy);

    expect(messageId).toBeDefined();
    expect(typeof messageId).toBe('string');
    expect(messageId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    expect(mockInsert).toHaveBeenCalledWith(mockMessages);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        id: messageId,
        chatId,
        createdBy,
        title: 'Test Message',
        requestMessage: 'This is a test message request',
        responseMessages: [{ content: 'This is a test response' }],
        reasoning: { steps: ['Test reasoning step 1', 'Test reasoning step 2'] },
        rawLlmMessages: [],
        finalReasoningMessage: 'Test final reasoning',
        isCompleted: true,
      })
    );
  });

  test('creates test message with custom options', async () => {
    const chatId = 'test-chat-id';
    const createdBy = 'test-user-id';
    const options: CreateTestMessageOptions = {
      title: 'Custom Title',
      requestMessage: 'Custom request',
      responseMessages: { content: 'Custom response' },
      reasoning: { custom: 'reasoning' },
      rawLlmMessages: [{ role: 'user', content: 'Hello' }],
      finalReasoningMessage: 'Custom final reasoning',
      isCompleted: false,
      feedback: 'Custom feedback',
    };

    const messageId = await createTestMessage(chatId, createdBy, options);

    expect(messageId).toBeDefined();

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        id: messageId,
        chatId,
        createdBy,
        title: 'Custom Title',
        requestMessage: 'Custom request',
        responseMessages: { content: 'Custom response' },
        reasoning: { custom: 'reasoning' },
        rawLlmMessages: [{ role: 'user', content: 'Hello' }],
        finalReasoningMessage: 'Custom final reasoning',
        isCompleted: false,
        feedback: 'Custom feedback',
      })
    );
  });

  test('creates test message with partial options', async () => {
    const chatId = 'test-chat-id';
    const createdBy = 'test-user-id';
    const options: CreateTestMessageOptions = {
      title: 'Partial Title',
      isCompleted: false,
    };

    const messageId = await createTestMessage(chatId, createdBy, options);

    expect(messageId).toBeDefined();

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        id: messageId,
        chatId,
        createdBy,
        title: 'Partial Title',
        requestMessage: 'This is a test message request',
        responseMessages: [{ content: 'This is a test response' }],
        reasoning: { steps: ['Test reasoning step 1', 'Test reasoning step 2'] },
        rawLlmMessages: [],
        finalReasoningMessage: 'Test final reasoning',
        isCompleted: false,
      })
    );

    expect(mockValues).toHaveBeenCalledWith(
      expect.not.objectContaining({
        feedback: expect.anything(),
      })
    );
  });

  test('handles database insertion error', async () => {
    const chatId = 'test-chat-id';
    const createdBy = 'test-user-id';

    mockValues.mockRejectedValue(new Error('Database error'));

    await expect(createTestMessage(chatId, createdBy)).rejects.toThrow(
      'Failed to create test message: Database error'
    );
  });

  test('handles unknown error', async () => {
    const chatId = 'test-chat-id';
    const createdBy = 'test-user-id';

    mockValues.mockRejectedValue('Unknown error');

    await expect(createTestMessage(chatId, createdBy)).rejects.toThrow(
      'Failed to create test message: Unknown error'
    );
  });

  test('excludes feedback when not provided', async () => {
    const chatId = 'test-chat-id';
    const createdBy = 'test-user-id';

    await createTestMessage(chatId, createdBy);

    const callArgs = mockValues.mock.calls[0]?.[0];
    expect(callArgs).not.toHaveProperty('feedback');
  });

  test('includes feedback when provided', async () => {
    const chatId = 'test-chat-id';
    const createdBy = 'test-user-id';
    const options: CreateTestMessageOptions = {
      feedback: 'Test feedback',
    };

    await createTestMessage(chatId, createdBy, options);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        feedback: 'Test feedback',
      })
    );
  });
});
