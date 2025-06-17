import { cleanupTestEnvironment, setupTestEnvironment } from '@buster/test-utils';
import { createTestMessageWithContext } from '@buster/test-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { getLatestMessageForChat, updateMessageFields } from '../../src/helpers/messages';

describe('updateMessageFields', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  test('updates only responseMessages when provided', async () => {
    const { messageId, chatId } = await createTestMessageWithContext();

    const newResponseMessages = { content: 'Updated response' };

    const result = await updateMessageFields(messageId, {
      responseMessages: newResponseMessages,
    });

    expect(result.success).toBe(true);

    const updatedMessage = await getLatestMessageForChat(chatId);
    expect(updatedMessage?.responseMessages).toEqual(newResponseMessages);
  });

  test('updates only reasoning when provided', async () => {
    const { messageId, chatId } = await createTestMessageWithContext();

    const newReasoning = [
      {
        id: 'test-id',
        type: 'text',
        title: 'llm chunk',
        status: 'completed',
        message: 'Test reasoning',
        message_chunk: null,
        secondary_title: 'dummy',
        finished_reasoning: false,
      },
    ];

    const result = await updateMessageFields(messageId, {
      reasoning: newReasoning,
    });

    expect(result.success).toBe(true);

    const updatedMessage = await getLatestMessageForChat(chatId);
    expect(updatedMessage?.reasoning).toEqual(newReasoning);
  });

  test('updates multiple fields in a single call', async () => {
    const { messageId, chatId } = await createTestMessageWithContext();

    const newResponseMessages = { content: 'Updated response' };
    const newReasoning = [{ id: '1', message: 'Test' }];
    const newRawLlmMessages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ];

    const result = await updateMessageFields(messageId, {
      responseMessages: newResponseMessages,
      reasoning: newReasoning,
      rawLlmMessages: newRawLlmMessages,
    });

    expect(result.success).toBe(true);

    const updatedMessage = await getLatestMessageForChat(chatId);
    expect(updatedMessage?.responseMessages).toEqual(newResponseMessages);
    expect(updatedMessage?.reasoning).toEqual(newReasoning);
    expect(updatedMessage?.rawLlmMessages).toEqual(newRawLlmMessages);
  });

  test('throws error when reasoning is null', async () => {
    const { messageId } = await createTestMessageWithContext();

    await expect(updateMessageFields(messageId, { reasoning: null as never })).rejects.toThrow(
      'Reasoning cannot be null'
    );
  });

  test('throws error for non-existent message', async () => {
    await expect(
      updateMessageFields('00000000-0000-0000-0000-000000000000', {
        responseMessages: {},
      })
    ).rejects.toThrow('Message not found');
  });
});
