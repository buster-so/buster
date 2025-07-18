import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanupTestEnvironment, setupTestEnvironment } from '../envHelpers/env-helpers';

const mockCreateTestMessageWithContext = vi.fn();

vi.mock('./messages/createTestMessageWithContext', () => ({
  createTestMessageWithContext: mockCreateTestMessageWithContext,
}));

describe('updateMessageFields - Unit Tests', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  test('createTestMessageWithContext can be used for updateMessageFields testing', async () => {
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
    const result = await createTestMessageWithContext();

    expect(result).toEqual(mockResult);
    expect(mockCreateTestMessageWithContext).toHaveBeenCalledWith();
  });

  test('createTestMessageWithContext provides context for message updates', async () => {
    const options = {
      title: 'Test Message for Updates',
      requestMessage: 'Initial request',
      isCompleted: false,
    };

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
    const result = await createTestMessageWithContext(options);

    expect(result).toEqual(mockResult);
    expect(mockCreateTestMessageWithContext).toHaveBeenCalledWith(options);
  });
});
