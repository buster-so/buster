import { cleanupTestEnvironment, setupTestEnvironment } from '@buster/test-utils';
import { createTestMessageWithContext } from '@buster/test-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import {
  type MessageContextInput,
  getMessageContext,
} from '../../../src/helpers/messages/messageContext';

describe('Message Context Helper', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  test('getMessageContext returns essential context successfully', async () => {
    const { messageId, userId, chatId, organizationId } = await createTestMessageWithContext();

    const input: MessageContextInput = { messageId };
    const context = await getMessageContext(input);

    expect(context.messageId).toBe(messageId);
    expect(context.userId).toBe(userId);
    expect(context.chatId).toBe(chatId);
    expect(context.organizationId).toBe(organizationId);
    expect(context.requestMessage).toBeDefined();
  });

  test('getMessageContext validates UUID input', async () => {
    const input: MessageContextInput = { messageId: 'invalid-uuid' };

    await expect(getMessageContext(input)).rejects.toThrow('Message ID must be a valid UUID');
  });

  test('getMessageContext throws for non-existent message', async () => {
    const input: MessageContextInput = {
      messageId: '00000000-0000-0000-0000-000000000000',
    };

    await expect(getMessageContext(input)).rejects.toThrow('Message not found or has been deleted');
  });
});
