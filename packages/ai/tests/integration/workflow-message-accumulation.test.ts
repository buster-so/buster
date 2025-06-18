import type {
  CoreMessage,
  TextPart,
  TextStreamPart,
  ToolCallPart,
  ToolResultPart,
  ToolSet,
} from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChunkProcessor } from '../../src/utils/database/chunk-processor';

// Mock the database update function
vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn().mockResolvedValue(undefined),
}));

describe('Workflow Message Accumulation Integration', () => {
  const mockMessageId = 'test-message-id';

  it('should not create duplicate messages when passing from think-and-prep to analyst step', async () => {
    // Step 1: Simulate think-and-prep step processing
    const thinkAndPrepProcessor = new ChunkProcessor(mockMessageId, [], [], []);

    // Initial user message
    const userMessage: CoreMessage = {
      role: 'user',
      content: 'of our accessory products, what are the top 5 by revenue this month?',
    };

    // Todo list message
    const todoMessage: CoreMessage = {
      role: 'user',
      content: [
        {
          text: '<todo_list>\n        - Below are the items on your TODO list:\n        [ ] Determine how "accessory products" are identified in the data\n[ ] Determine how "revenue" is calculated for products\n[ ] Determine how to filter by "this month"\n[ ] Determine sorting and limit for selecting the top 5 products\n[ ] Determine the visualization type and axes\n        </todo_list>',
          type: 'text',
        },
      ],
    };

    // Set initial messages
    thinkAndPrepProcessor.setInitialMessages([userMessage, todoMessage]);

    // Simulate streaming a sequential thinking tool call
    await thinkAndPrepProcessor.processChunk({
      type: 'tool-call',
      toolCallId: 'toolu_01LTwRTpgZB7BcbemexP1EUp',
      toolName: 'sequentialThinking',
      args: {
        thought:
          'Let me work through the TODO list items to prepare for analyzing the top 5 accessory products by revenue this month.',
        isRevision: false,
        thoughtNumber: 1,
        totalThoughts: 3,
        needsMoreThoughts: false,
        nextThoughtNeeded: true,
      },
    } as TextStreamPart<ToolSet>);

    // Add tool result - cast through unknown for type compatibility
    await thinkAndPrepProcessor.processChunk({
      type: 'tool-result',
      toolCallId: 'toolu_01LTwRTpgZB7BcbemexP1EUp',
      toolName: 'sequentialThinking',
      result: {
        success: true,
      },
    } as unknown as TextStreamPart<ToolSet>);

    // Get the accumulated messages from think-and-prep
    const thinkAndPrepMessages = thinkAndPrepProcessor.getAccumulatedMessages();
    const thinkAndPrepReasoning = thinkAndPrepProcessor.getReasoningHistory();
    const thinkAndPrepResponse = thinkAndPrepProcessor.getResponseHistory();

    // Verify think-and-prep output
    expect(thinkAndPrepMessages).toHaveLength(4); // user + todo + assistant + tool result
    expect(thinkAndPrepReasoning).toHaveLength(1); // One reasoning entry for sequential thinking

    // Step 2: Pass messages to analyst step
    const analystProcessor = new ChunkProcessor(
      mockMessageId,
      [],
      thinkAndPrepReasoning,
      thinkAndPrepResponse
    );

    // This is the key operation that was causing duplicates
    analystProcessor.setInitialMessages(thinkAndPrepMessages);

    // Verify the fix: lastProcessedMessageIndex should be updated
    expect(analystProcessor.getLastProcessedIndex()).toBe(3); // Index of last message

    // Simulate analyst adding new messages
    await analystProcessor.processChunk({
      type: 'tool-call',
      toolCallId: 'toolu_012HZ18nq4zQSYfHtokgXLGz',
      toolName: 'executeSql',
      args: {
        statements: [
          'SELECT DISTINCT name FROM ont_ont.product_category LIMIT 25',
          "SELECT DISTINCT name FROM ont_ont.product_subcategory WHERE name ILIKE '%accessor%' LIMIT 25",
        ],
      },
    } as TextStreamPart<ToolSet>);

    // Get final messages
    const finalMessages = analystProcessor.getAccumulatedMessages();

    // Check for duplicates
    const toolCallMessages = finalMessages.filter(
      (m) =>
        m.role === 'assistant' &&
        Array.isArray(m.content) &&
        m.content.some((c) => c && typeof c === 'object' && 'type' in c && c.type === 'tool-call')
    );

    const toolCallIds = toolCallMessages
      .flatMap((m) => {
        if (!Array.isArray(m.content)) return [];
        return m.content as (TextPart | ToolCallPart | ToolResultPart)[];
      })
      .filter((c): c is ToolCallPart => {
        return c && typeof c === 'object' && 'type' in c && c.type === 'tool-call';
      })
      .map((c) => c.toolCallId);

    // Verify no duplicate tool call IDs
    const uniqueToolCallIds = new Set(toolCallIds);
    expect(toolCallIds.length).toBe(uniqueToolCallIds.size);

    // Verify specific tool calls
    expect(toolCallIds).toContain('toolu_01LTwRTpgZB7BcbemexP1EUp'); // From think-and-prep
    expect(toolCallIds).toContain('toolu_012HZ18nq4zQSYfHtokgXLGz'); // From analyst

    // Count occurrences of the think-and-prep tool call
    const thinkAndPrepToolCallCount = toolCallIds.filter(
      (id) => id === 'toolu_01LTwRTpgZB7BcbemexP1EUp'
    ).length;
    expect(thinkAndPrepToolCallCount).toBe(1); // Should appear exactly once, not duplicated
  });

  it('should accumulate messages correctly across multiple workflow steps', async () => {
    const processors: ChunkProcessor[] = [];
    const steps = ['step1', 'step2', 'step3'];
    let accumulatedMessages: CoreMessage[] = [
      {
        role: 'user',
        content: 'Initial question',
      },
    ];

    // Simulate multiple workflow steps
    for (let index = 0; index < steps.length; index++) {
      const stepName = steps[index];
      const processor = new ChunkProcessor(mockMessageId, [], [], []);
      processor.setInitialMessages(accumulatedMessages);

      // Each step adds a message
      await processor.processChunk({
        type: 'text-delta',
        textDelta: `Response from ${stepName}`,
      } as TextStreamPart<ToolSet>);

      accumulatedMessages = processor.getAccumulatedMessages();
      processors.push(processor);

      // Verify correct accumulation
      expect(accumulatedMessages).toHaveLength(index + 2); // Initial + one per step
    }

    // Final verification
    expect(accumulatedMessages).toHaveLength(4); // 1 initial + 3 steps
    const firstMessage = accumulatedMessages[0];
    if (firstMessage) {
      expect(firstMessage.role).toBe('user');
      expect(firstMessage.content).toBe('Initial question');
    }

    // Check each step's response
    for (let i = 0; i < steps.length; i++) {
      const message = accumulatedMessages[i + 1];
      if (message) {
        expect(message.role).toBe('assistant');
        const stepName = steps[i];
        if (stepName) {
          expect(message.content).toEqual([{ type: 'text', text: `Response from ${stepName}` }]);
        }
      }
    }
  });
});
