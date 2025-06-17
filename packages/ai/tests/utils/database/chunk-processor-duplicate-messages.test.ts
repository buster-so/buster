import type { CoreMessage, TextStreamPart } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { ChunkProcessor } from '../../../src/utils/database/chunk-processor';

// Mock the database update function
vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn().mockResolvedValue(undefined),
}));

describe('ChunkProcessor - Duplicate Message Detection', () => {
  const mockMessageId = 'test-message-id';

  it('should not create duplicate assistant messages with same toolCallId', async () => {
    const processor = new ChunkProcessor(mockMessageId, [], [], []);

    // Set initial messages (user prompt + todo list)
    const initialMessages: CoreMessage[] = [
      {
        role: 'user',
        content: 'of our accessory products, what are the top 5 by revenue this month?',
      },
      {
        role: 'user',
        content: [
          {
            text: '<todo_list>\n        - Below are the items on your TODO list:\n        [ ] Determine how "accessory products" are identified in the data\n[ ] Determine how "revenue" is calculated for products\n[ ] Determine how to filter by "this month"\n[ ] Determine sorting and limit for selecting the top 5 products\n[ ] Determine the visualization type and axes\n        </todo_list>',
            type: 'text',
          },
        ],
      },
    ];

    processor.setInitialMessages(initialMessages);
    expect(processor.getLastProcessedIndex()).toBe(1); // Last initial message

    // Simulate streaming of sequential thinking tool call
    const toolCallId = 'toolu_01Mvn2dPmMEDzYbsM98pPtaC';

    // First, tool-call-streaming-start
    await processor.processChunk({
      type: 'tool-call-streaming-start',
      toolCallId,
      toolName: 'sequentialThinking',
    } as TextStreamPart<any>);

    // Then tool-call-delta events (simulating streaming args)
    await processor.processChunk({
      type: 'tool-call-delta',
      toolCallId,
      argsTextDelta: '{"thought": "Let me work through',
    } as TextStreamPart<any>);

    await processor.processChunk({
      type: 'tool-call-delta',
      toolCallId,
      argsTextDelta: ' the TODO list items..."}',
    } as TextStreamPart<any>);

    // Then the complete tool-call event
    await processor.processChunk({
      type: 'tool-call',
      toolCallId,
      toolName: 'sequentialThinking',
      args: {
        thought: 'Let me work through the TODO list items...',
        isRevision: false,
        thoughtNumber: 1,
        totalThoughts: 3,
        needsMoreThoughts: false,
        nextThoughtNeeded: true,
      },
    } as TextStreamPart<any>);

    // Tool result
    await processor.processChunk({
      type: 'tool-result',
      toolCallId,
      toolName: 'sequentialThinking',
      result: { success: true },
    } as TextStreamPart<any>);

    // Get accumulated messages
    const messages = processor.getAccumulatedMessages();

    // Count assistant messages with the same toolCallId
    const assistantMessagesWithToolCall = messages.filter((msg) => {
      if (msg.role !== 'assistant' || !Array.isArray(msg.content)) return false;
      return msg.content.some(
        (item: any) => item.type === 'tool-call' && item.toolCallId === toolCallId
      );
    });

    // Should only have ONE assistant message with this toolCallId
    expect(assistantMessagesWithToolCall).toHaveLength(1);

    // Verify the structure
    expect(messages).toHaveLength(4); // 2 initial + 1 assistant + 1 tool result
    expect(messages[0]).toEqual(initialMessages[0]);
    expect(messages[1]).toEqual(initialMessages[1]);
    expect(messages[2].role).toBe('assistant');
    expect(messages[3].role).toBe('tool');

    // Verify the assistant message has the tool call
    const assistantMsg = messages[2];
    expect(assistantMsg.content).toEqual([
      {
        type: 'tool-call',
        toolCallId,
        toolName: 'sequentialThinking',
        args: {
          thought: 'Let me work through the TODO list items...',
          isRevision: false,
          thoughtNumber: 1,
          totalThoughts: 3,
          needsMoreThoughts: false,
          nextThoughtNeeded: true,
        },
      },
    ]);
  });

  it('should handle multiple streaming tool calls without duplicates', async () => {
    const processor = new ChunkProcessor(mockMessageId, [], [], []);

    // Process first tool call
    const toolCallId1 = 'toolu_01ABC';
    await processor.processChunk({
      type: 'tool-call-streaming-start',
      toolCallId: toolCallId1,
      toolName: 'executeSql',
    } as TextStreamPart<any>);

    await processor.processChunk({
      type: 'tool-call',
      toolCallId: toolCallId1,
      toolName: 'executeSql',
      args: { statements: ['SELECT 1'] },
    } as TextStreamPart<any>);

    await processor.processChunk({
      type: 'tool-result',
      toolCallId: toolCallId1,
      toolName: 'executeSql',
      result: { results: [] },
    } as TextStreamPart<any>);

    // Process second tool call
    const toolCallId2 = 'toolu_02DEF';
    await processor.processChunk({
      type: 'tool-call-streaming-start',
      toolCallId: toolCallId2,
      toolName: 'executeSql',
    } as TextStreamPart<any>);

    await processor.processChunk({
      type: 'tool-call',
      toolCallId: toolCallId2,
      toolName: 'executeSql',
      args: { statements: ['SELECT 2'] },
    } as TextStreamPart<any>);

    await processor.processChunk({
      type: 'tool-result',
      toolCallId: toolCallId2,
      toolName: 'executeSql',
      result: { results: [] },
    } as TextStreamPart<any>);

    const messages = processor.getAccumulatedMessages();

    // Should have 4 messages: 2 assistant + 2 tool results
    expect(messages).toHaveLength(4);

    // Each tool call should appear exactly once
    const toolCallIds = messages
      .filter((m) => m.role === 'assistant')
      .flatMap((m) => (Array.isArray(m.content) ? m.content : []))
      .filter((c: any) => c.type === 'tool-call')
      .map((c: any) => c.toolCallId);

    expect(toolCallIds).toEqual([toolCallId1, toolCallId2]);
    expect(new Set(toolCallIds).size).toBe(toolCallIds.length); // No duplicates
  });

  it('should not duplicate messages when same content is processed multiple times', async () => {
    const processor = new ChunkProcessor(mockMessageId, [], [], []);

    // Simulate a scenario where the same tool call might be processed twice
    // (this could happen due to retries or other issues)
    const toolCallId = 'toolu_01XYZ';

    // First processing
    await processor.processChunk({
      type: 'tool-call',
      toolCallId,
      toolName: 'sequentialThinking',
      args: { thought: 'Test thought' },
    } as TextStreamPart<any>);

    // Get messages after first processing
    const messagesAfterFirst = processor.getAccumulatedMessages();
    expect(messagesAfterFirst).toHaveLength(1);

    // Try to process the same tool call again (shouldn't create duplicate)
    await processor.processChunk({
      type: 'tool-call',
      toolCallId,
      toolName: 'sequentialThinking',
      args: { thought: 'Test thought' },
    } as TextStreamPart<any>);

    // Should still have only 1 message
    const messagesAfterSecond = processor.getAccumulatedMessages();
    expect(messagesAfterSecond).toHaveLength(1);
  });
});
