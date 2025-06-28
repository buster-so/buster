import type { CoreMessage, TextStreamPart, ToolSet } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { ChunkProcessor } from '../../../src/utils/database/chunk-processor';

// Mock the database update function
vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn().mockResolvedValue(undefined),
}));

describe('ChunkProcessor', () => {
  const mockMessageId = 'test-message-id';

  it('should not include user messages in reasoning', async () => {
    const processor = new ChunkProcessor(mockMessageId);

    // Simulate a user message chunk
    const userMessage: CoreMessage = {
      role: 'user',
      content: 'How can I analyze my data?',
    };

    // Add the user message to accumulated messages
    processor.setInitialMessages([userMessage]);

    // Process a tool call chunk
    await processor.processChunk({
      type: 'tool-call',
      toolCallId: 'call-1',
      toolName: 'sequentialThinking',
      args: {
        thought: 'I need to understand the data structure',
        thoughtNumber: 1,
        totalThoughts: 3,
        nextThoughtNeeded: true,
      },
    } as TextStreamPart<ToolSet>);

    // Get the reasoning history
    const reasoning = processor.getReasoningHistory();

    // Should only have the tool call, not the user message
    expect(reasoning).toHaveLength(1);
    expect(reasoning[0]).toMatchObject({
      type: 'text',
      message: 'I need to understand the data structure',
    });
  });

  it('should extract response messages with correct field names', async () => {
    const processor = new ChunkProcessor(mockMessageId);

    // Process doneTool with final_response
    await processor.processChunk({
      type: 'tool-call',
      toolCallId: 'done-1',
      toolName: 'doneTool',
      args: {
        final_response: 'Here is your analysis summary.',
      },
    } as TextStreamPart<ToolSet>);

    // Process respondWithoutAnalysis with final_response
    await processor.processChunk({
      type: 'tool-call',
      toolCallId: 'respond-1',
      toolName: 'respondWithoutAnalysis',
      args: {
        final_response: 'I cannot analyze this type of data.',
      },
    } as TextStreamPart<ToolSet>);

    // Trigger save to finalize messages
    await processor.processChunk({ type: 'finish' } as TextStreamPart<ToolSet>);

    // Get the response history
    const responses = processor.getResponseHistory();

    // Should have both response messages with correct content
    expect(responses).toHaveLength(2);
    expect(responses[0]).toMatchObject({
      id: 'done-1',
      type: 'text',
      message: 'Here is your analysis summary.',
      is_final_message: true,
    });
    expect(responses[1]).toMatchObject({
      id: 'respond-1',
      type: 'text',
      message: 'I cannot analyze this type of data.',
      is_final_message: true,
    });
  });

  it('should prevent duplicate processing with lastProcessedMessageIndex', async () => {
    const initialMessages: CoreMessage[] = [
      {
        role: 'user',
        content: 'First question',
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'existing-1',
            toolName: 'sequentialThinking',
            args: { thought: 'Existing thought', thoughtNumber: 1 },
          },
        ],
      },
    ];

    const processor = new ChunkProcessor(mockMessageId, initialMessages);

    // Process a new tool call
    await processor.processChunk({
      type: 'tool-call',
      toolCallId: 'new-1',
      toolName: 'sequentialThinking',
      args: {
        thought: 'New thought',
        thoughtNumber: 2,
        totalThoughts: 2,
      },
    } as TextStreamPart<ToolSet>);

    // Trigger save
    await processor.processChunk({ type: 'finish' } as TextStreamPart<ToolSet>);

    // Get reasoning history
    const reasoning = processor.getReasoningHistory();

    // Should only have the new tool call (existing messages were already processed)
    expect(reasoning).toHaveLength(1);
    expect(reasoning[0]).toMatchObject({
      message: 'New thought',
    });
  });

  // Note: TODO list extraction is handled by formatLlmMessagesAsReasoning, not ChunkProcessor
  // ChunkProcessor only handles streaming tool calls from the AI
  it.skip('should handle todo list messages as special case', async () => {
    const processor = new ChunkProcessor(mockMessageId);

    const todoMessage: CoreMessage = {
      role: 'user',
      content: `Here's what we need to do:
<todo_list>
1. Analyze the data
2. Create visualizations
3. Generate report
</todo_list>`,
    };

    processor.setInitialMessages([todoMessage]);

    // Trigger processing
    await processor.processChunk({ type: 'finish' } as TextStreamPart<ToolSet>);

    const reasoning = processor.getReasoningHistory();

    // Should include the todo list as a file
    expect(reasoning).toHaveLength(1);
    expect(reasoning[0]).toMatchObject({
      type: 'files',
      title: 'TODO List',
      status: 'completed',
    });
  });
});

describe('ChunkProcessor - Cross-Step Message Accumulation', () => {
  const mockMessageId = 'test-message-id';

  it('should update lastProcessedMessageIndex when setting initial messages', () => {
    // Sample messages that might come from think-and-prep step
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
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolName: 'sequentialThinking',
            toolCallId: 'toolu_01LTwRTpgZB7BcbemexP1EUp',
            args: {
              thought: 'Let me work through the TODO list items...',
              isRevision: false,
              thoughtNumber: 1,
              totalThoughts: 3,
              needsMoreThoughts: false,
              nextThoughtNeeded: true,
            },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolName: 'sequentialThinking',
            toolCallId: 'toolu_01LTwRTpgZB7BcbemexP1EUp',
            result: {
              success: true,
            },
          },
        ],
      },
    ];

    const processor = new ChunkProcessor(mockMessageId);

    // Set initial messages (simulating what happens in analyst-step)
    processor.setInitialMessages(initialMessages);

    // Check that accumulated messages are set correctly
    const accumulated = processor.getAccumulatedMessages();
    expect(accumulated).toHaveLength(4);
    expect(accumulated).toEqual(initialMessages);

    // The key fix: lastProcessedMessageIndex should be updated
    // This prevents these messages from being treated as "new" during processing
    expect(processor.getLastProcessedIndex()).toBe(3); // Index of last message (0-based)
  });

  it('should properly accumulate messages across workflow steps without duplicates', async () => {
    // Step 1: think-and-prep processes initial messages
    const thinkAndPrepProcessor = new ChunkProcessor(mockMessageId);

    const initialMessages: CoreMessage[] = [
      { role: 'user', content: 'What are the top products?' },
    ];

    thinkAndPrepProcessor.setInitialMessages(initialMessages);

    // Simulate think-and-prep adding new messages via streaming
    await thinkAndPrepProcessor.processChunk({
      type: 'tool-call',
      toolCallId: 'think-1',
      toolName: 'sequentialThinking',
      args: {
        thought: 'Analyzing your request...',
        thoughtNumber: 1,
        totalThoughts: 1,
      },
    } as TextStreamPart<ToolSet>);

    await thinkAndPrepProcessor.processChunk({
      type: 'tool-result',
      toolCallId: 'think-1',
      toolName: 'sequentialThinking',
      result: { success: true },
    } as unknown as TextStreamPart<ToolSet>);

    // Get the output messages from think-and-prep
    const thinkAndPrepOutput = thinkAndPrepProcessor.getAccumulatedMessages();

    // Step 2: analyst-step receives all messages from think-and-prep
    const analystProcessor = new ChunkProcessor(
      mockMessageId,
      [],
      thinkAndPrepProcessor.getReasoningHistory(),
      thinkAndPrepProcessor.getResponseHistory()
    );
    analystProcessor.setInitialMessages(thinkAndPrepOutput);

    // Verify proper accumulation
    expect(analystProcessor.getAccumulatedMessages()).toHaveLength(3); // user + assistant + tool result
    expect(analystProcessor.getLastProcessedIndex()).toBe(2);

    // Simulate analyst adding more messages
    await analystProcessor.processChunk({
      type: 'tool-call',
      toolCallId: 'analyze-1',
      toolName: 'executeSql',
      args: {
        statements: ['SELECT * FROM products ORDER BY revenue DESC LIMIT 5'],
      },
    } as TextStreamPart<ToolSet>);

    // Final verification: no duplicates, proper accumulation
    const finalMessages = analystProcessor.getAccumulatedMessages();
    expect(finalMessages.length).toBeGreaterThan(3); // Added new messages

    // Check for duplicates
    const duplicates = findDuplicateMessages(finalMessages);
    expect(duplicates).toHaveLength(0);
  });

  it('should handle the actual duplicate scenario from the bug report', async () => {
    // These are the actual messages that were duplicated
    const messagesFromThinkAndPrep: CoreMessage[] = [
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
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolName: 'sequentialThinking',
            toolCallId: 'toolu_01LTwRTpgZB7BcbemexP1EUp',
            args: {
              thought:
                'Let me work through the TODO list items to prepare for analyzing the top 5 accessory products by revenue this month.',
              isRevision: false,
              thoughtNumber: 1,
              totalThoughts: 3,
              needsMoreThoughts: false,
              nextThoughtNeeded: true,
            },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolName: 'sequentialThinking',
            toolCallId: 'toolu_01LTwRTpgZB7BcbemexP1EUp',
            result: {
              success: true,
            },
          },
        ],
      },
    ];

    // Simulate analyst-step receiving these messages
    const analystProcessor = new ChunkProcessor(mockMessageId);
    analystProcessor.setInitialMessages(messagesFromThinkAndPrep);

    expect(analystProcessor.getAccumulatedMessages()).toHaveLength(4);
    expect(analystProcessor.getLastProcessedIndex()).toBe(3);

    // Process a new message (should not duplicate existing ones)
    await analystProcessor.processChunk({
      type: 'tool-call',
      toolCallId: 'toolu_new',
      toolName: 'executeSql',
      args: {
        statements: ['SELECT * FROM products'],
      },
    } as TextStreamPart<ToolSet>);

    // Check that we don't have duplicates
    const finalMessages = analystProcessor.getAccumulatedMessages();
    const assistantMessages = finalMessages.filter((m) => m.role === 'assistant');
    const toolCallIds = assistantMessages
      .flatMap((m) => (Array.isArray(m.content) ? m.content : []))
      .filter((c) => c.type === 'tool-call')
      .map((c) => c.toolCallId);

    // Check for duplicate tool call IDs
    const uniqueToolCallIds = new Set(toolCallIds);
    expect(toolCallIds.length).toBe(uniqueToolCallIds.size); // No duplicates
  });

  it('should maintain proper index tracking when processing new chunks after setInitialMessages', async () => {
    const processor = new ChunkProcessor(mockMessageId);

    // Initial messages from a previous step
    const initialMessages: CoreMessage[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ];

    processor.setInitialMessages(initialMessages);
    expect(processor.getLastProcessedIndex()).toBe(1); // Should be set to last message index

    // Process new chunks
    await processor.processChunk({
      type: 'text-delta',
      textDelta: ' How can I help?',
    } as TextStreamPart<ToolSet>);

    const messages = processor.getAccumulatedMessages();
    expect(messages).toHaveLength(3); // Original 2 + new assistant message
    expect(messages[2].role).toBe('assistant');
    expect(messages[2].content).toEqual([{ type: 'text', text: ' How can I help?' }]);
  });
});

// Helper to detect duplicate messages
function findDuplicateMessages(messages: CoreMessage[]): CoreMessage[] {
  const seen = new Map<string, CoreMessage>();
  const duplicates: CoreMessage[] = [];

  for (const msg of messages) {
    const key = JSON.stringify({
      role: msg.role,
      content: msg.content,
      // Include tool call ID for tool-related messages
      toolCallId:
        msg.content && Array.isArray(msg.content)
          ? msg.content.find((c) => c.type === 'tool-call')?.toolCallId
          : undefined,
    });

    if (seen.has(key)) {
      duplicates.push(msg);
    } else {
      seen.set(key, msg);
    }
  }

  return duplicates;
}
