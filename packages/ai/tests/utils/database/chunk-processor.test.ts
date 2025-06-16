import type { CoreMessage, TextStreamPart } from 'ai';
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
    } as TextStreamPart<any>);

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
    } as TextStreamPart<any>);

    // Process respondWithoutAnalysis with response
    await processor.processChunk({
      type: 'tool-call',
      toolCallId: 'respond-1',
      toolName: 'respondWithoutAnalysis',
      args: {
        response: 'I cannot analyze this type of data.',
      },
    } as TextStreamPart<any>);

    // Trigger save to finalize messages
    await processor.processChunk({ type: 'finish' } as TextStreamPart<any>);

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
    } as TextStreamPart<any>);

    // Trigger save
    await processor.processChunk({ type: 'finish' } as TextStreamPart<any>);

    // Get reasoning history
    const reasoning = processor.getReasoningHistory();

    // Should only have the new tool call (existing messages were already processed)
    expect(reasoning).toHaveLength(1);
    expect(reasoning[0]).toMatchObject({
      message: 'New thought',
    });
  });

  it('should handle todo list messages as special case', async () => {
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
    await processor.processChunk({ type: 'finish' } as TextStreamPart<any>);

    const reasoning = processor.getReasoningHistory();

    // Should include the todo list as a file
    expect(reasoning).toHaveLength(1);
    expect(reasoning[0]).toMatchObject({
      type: 'files',
      title: 'TODO List',
      status: 'completed',
    });
    expect(reasoning[0].files[reasoning[0].file_ids[0]]).toMatchObject({
      file_type: 'metric',
      file_name: 'todo_list.txt',
      file: {
        text: '1. Analyze the data\n2. Create visualizations\n3. Generate report',
      },
    });
  });
});
