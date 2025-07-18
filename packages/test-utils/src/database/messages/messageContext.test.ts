import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanupTestEnvironment, setupTestEnvironment } from '../../envHelpers/env-helpers';

const mockCreateTestMessageWithContext = vi.fn();

vi.mock('./createTestMessageWithContext', () => ({
  createTestMessageWithContext: mockCreateTestMessageWithContext,
}));

describe('Message Context Helper - Unit Tests', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  test('createTestMessageWithContext creates message with context', async () => {
    const mockResult = {
      messageId: 'test-message-id',
      userId: 'test-user-id',
      chatId: 'test-chat-id',
      organizationId: 'test-org-id',
    };

    mockCreateTestMessageWithContext.mockResolvedValue(mockResult);

    const { createTestMessageWithContext } = await import('./createTestMessageWithContext');
    const result = await createTestMessageWithContext();

    expect(result).toEqual(mockResult);
    expect(mockCreateTestMessageWithContext).toHaveBeenCalledWith();
  });

  test('createTestMessageWithContext with custom options', async () => {
    const options = {
      title: 'Custom Test Message',
      requestMessage: 'Custom request',
      isCompleted: false,
    };

    const mockResult = {
      messageId: 'test-message-id',
      userId: 'test-user-id',
      chatId: 'test-chat-id',
      organizationId: 'test-org-id',
    };

    mockCreateTestMessageWithContext.mockResolvedValue(mockResult);

    const { createTestMessageWithContext } = await import('./createTestMessageWithContext');
    const result = await createTestMessageWithContext(options);

    expect(result).toEqual(mockResult);
    expect(mockCreateTestMessageWithContext).toHaveBeenCalledWith(options);
  });
});
