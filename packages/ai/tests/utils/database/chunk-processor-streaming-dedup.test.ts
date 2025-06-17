import type { CoreMessage, TextStreamPart, ToolSet } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChunkProcessor } from '../../../src/utils/database/chunk-processor';

// Mock the database update function
vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn().mockResolvedValue(undefined),
}));

describe('ChunkProcessor - Streaming Tool Call Deduplication', () => {
  const mockMessageId = 'test-message-id';

  it('should not create duplicate tool calls when receiving both streaming-start and complete tool-call events', async () => {
    const processor = new ChunkProcessor(mockMessageId);

    // Step 1: Simulate streaming start for a tool call
    await processor.processChunk({
      type: 'tool-call-streaming-start',
      toolCallId: 'tool-123',
      toolName: 'executeSql',
    } as TextStreamPart<ToolSet>);

    // Verify tool call was added with empty args
    let messages = processor.getAccumulatedMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('assistant');
    expect(messages[0].content).toHaveLength(1);
    expect(messages[0].content[0]).toMatchObject({
      type: 'tool-call',
      toolCallId: 'tool-123',
      toolName: 'executeSql',
      args: {},
    });

    // Step 2: Simulate streaming deltas
    await processor.processChunk({
      type: 'tool-call-delta',
      toolCallId: 'tool-123',
      argsTextDelta: '{"statements": ["SELECT * FROM products"]}',
    } as TextStreamPart<ToolSet>);

    // Step 3: Simulate complete tool-call event
    await processor.processChunk({
      type: 'tool-call',
      toolCallId: 'tool-123',
      toolName: 'executeSql',
      args: {
        statements: ['SELECT * FROM products'],
      },
    } as TextStreamPart<ToolSet>);

    // Verify only one tool call exists (not duplicated)
    messages = processor.getAccumulatedMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('assistant');
    expect(messages[0].content).toHaveLength(1); // Should still be 1, not 2
    expect(messages[0].content[0]).toMatchObject({
      type: 'tool-call',
      toolCallId: 'tool-123',
      toolName: 'executeSql',
      args: {
        statements: ['SELECT * FROM products'],
      },
    });
  });

  it('should handle multiple streaming tool calls without duplication', async () => {
    const processor = new ChunkProcessor(mockMessageId);

    // First tool call - streaming
    await processor.processChunk({
      type: 'tool-call-streaming-start',
      toolCallId: 'tool-1',
      toolName: 'sequentialThinking',
    } as TextStreamPart<ToolSet>);

    await processor.processChunk({
      type: 'tool-call',
      toolCallId: 'tool-1',
      toolName: 'sequentialThinking',
      args: { thought: 'First thought', nextThoughtNeeded: true },
    } as TextStreamPart<ToolSet>);

    // Second tool call - streaming
    await processor.processChunk({
      type: 'tool-call-streaming-start',
      toolCallId: 'tool-2',
      toolName: 'executeSql',
    } as TextStreamPart<ToolSet>);

    await processor.processChunk({
      type: 'tool-call',
      toolCallId: 'tool-2',
      toolName: 'executeSql',
      args: { statements: ['SELECT COUNT(*) FROM users'] },
    } as TextStreamPart<ToolSet>);

    // Verify we have exactly 2 tool calls, not 4
    const messages = processor.getAccumulatedMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('assistant');
    expect(messages[0].content).toHaveLength(2); // Two tool calls

    // Check tool call IDs are unique
    const toolCallIds = messages[0].content
      .filter((c: any) => c.type === 'tool-call')
      .map((c: any) => c.toolCallId);

    expect(toolCallIds).toEqual(['tool-1', 'tool-2']);

    // Verify each tool has correct args
    expect(messages[0].content[0]).toMatchObject({
      type: 'tool-call',
      toolCallId: 'tool-1',
      toolName: 'sequentialThinking',
      args: { thought: 'First thought', nextThoughtNeeded: true },
    });

    expect(messages[0].content[1]).toMatchObject({
      type: 'tool-call',
      toolCallId: 'tool-2',
      toolName: 'executeSql',
      args: { statements: ['SELECT COUNT(*) FROM users'] },
    });
  });

  it('should handle non-streaming tool calls normally', async () => {
    const processor = new ChunkProcessor(mockMessageId);

    // Direct tool-call without streaming
    await processor.processChunk({
      type: 'tool-call',
      toolCallId: 'direct-tool',
      toolName: 'doneTool',
      args: { final_response: 'Analysis complete' },
    } as TextStreamPart<ToolSet>);

    const messages = processor.getAccumulatedMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toHaveLength(1);
    expect(messages[0].content[0]).toMatchObject({
      type: 'tool-call',
      toolCallId: 'direct-tool',
      toolName: 'doneTool',
      args: { final_response: 'Analysis complete' },
    });
  });

  it('should update args when receiving complete tool-call after streaming', async () => {
    const processor = new ChunkProcessor(mockMessageId);

    // Start with streaming and partial args
    await processor.processChunk({
      type: 'tool-call-streaming-start',
      toolCallId: 'update-test',
      toolName: 'createMetrics',
    } as TextStreamPart<ToolSet>);

    await processor.processChunk({
      type: 'tool-call-delta',
      toolCallId: 'update-test',
      argsTextDelta: '{"files": [{"name": "metric1.yml"',
    } as TextStreamPart<ToolSet>);

    // Verify partial state
    let messages = processor.getAccumulatedMessages();
    let toolCall = messages[0].content[0];
    expect(toolCall.args).toMatchObject({ files: [{ name: 'metric1.yml' }] });

    // Complete tool-call with full args
    await processor.processChunk({
      type: 'tool-call',
      toolCallId: 'update-test',
      toolName: 'createMetrics',
      args: {
        files: [
          { name: 'metric1.yml', yml_content: 'content1' },
          { name: 'metric2.yml', yml_content: 'content2' },
        ],
      },
    } as TextStreamPart<ToolSet>);

    // Verify args were updated, not duplicated
    messages = processor.getAccumulatedMessages();
    expect(messages[0].content).toHaveLength(1); // Still just one tool call
    toolCall = messages[0].content[0];
    expect(toolCall.args).toEqual({
      files: [
        { name: 'metric1.yml', yml_content: 'content1' },
        { name: 'metric2.yml', yml_content: 'content2' },
      ],
    });
  });
});
