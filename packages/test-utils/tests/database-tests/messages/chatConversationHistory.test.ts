import {
  type ChatConversationHistoryInput,
  getChatConversationHistory,
} from '@buster/database/src/helpers/messages/chatConversationHistory';
import { createTestMessageWithContext } from '@buster/test-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { cleanupTestEnvironment, setupTestEnvironment } from '../helpers';

describe('Chat Conversation History Helper', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  test('getChatConversationHistory returns all messages in chat', async () => {
    const { messageId } = await createTestMessageWithContext();

    const input: ChatConversationHistoryInput = { messageId };
    const history = await getChatConversationHistory(input);

    expect(Array.isArray(history)).toBe(true);
  });

  test('getChatConversationHistory validates UUID input', async () => {
    const input: ChatConversationHistoryInput = { messageId: 'invalid-uuid' };

    await expect(getChatConversationHistory(input)).rejects.toThrow(
      'Message ID must be a valid UUID'
    );
  });

  test('getChatConversationHistory throws for non-existent message', async () => {
    const input: ChatConversationHistoryInput = {
      messageId: '00000000-0000-0000-0000-000000000000',
    };

    await expect(getChatConversationHistory(input)).rejects.toThrow(
      'Message not found or has been deleted'
    );
  });
});
