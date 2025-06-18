import type { TextStreamPart, ToolSet } from 'ai';
import { describe, expect, test } from 'vitest';
import { ChunkProcessor } from '../../../src/utils/database/chunk-processor';
import type { GenericToolSet } from '../../../src/utils/database/types';

describe('ChunkProcessor - Deferred doneTool Response', () => {
  test('should defer doneTool response when completed files exist', async () => {
    // Use null messageId to avoid database saves in unit tests
    const processor = new ChunkProcessor<GenericToolSet>(null);

    // First, start streaming a file creation
    const fileToolStart: TextStreamPart<ToolSet> = {
      type: 'tool-call-streaming-start',
      toolCallId: 'file-1',
      toolName: 'createMetrics',
    };
    await processor.processChunk(fileToolStart);

    // Stream the file data
    const fileToolDelta: TextStreamPart<ToolSet> = {
      type: 'tool-call-delta',
      toolCallId: 'file-1',
      toolName: 'createMetrics',
      argsTextDelta: JSON.stringify({
        files: [
          {
            name: 'test-metric.yml',
            yml_content: 'metric content',
          },
        ],
      }),
    };
    await processor.processChunk(fileToolDelta);

    // Complete the tool call
    const fileToolCall: TextStreamPart<ToolSet> = {
      type: 'tool-call',
      toolCallId: 'file-1',
      toolName: 'createMetrics',
      args: {
        files: [
          {
            name: 'test-metric.yml',
            yml_content: 'metric content',
          },
        ],
      },
    };
    await processor.processChunk(fileToolCall);

    // Mark the file as completed and update file IDs
    // Note: tool-result is handled internally by ChunkProcessor, we simulate it with another tool-call
    const fileResult = {
      type: 'tool-result' as const,
      toolCallId: 'file-1',
      toolName: 'createMetrics',
      result: {
        files: [{ id: 'actual-file-id', status: 'completed' }],
      },
    } as unknown as TextStreamPart<ToolSet>;
    await processor.processChunk(fileResult);

    // Verify file is completed in reasoning history
    const reasoningHistory = processor.getReasoningHistory();
    const fileEntry = reasoningHistory.find((r) => r.id === 'file-1');
    expect(fileEntry).toBeDefined();
    expect(fileEntry?.status).toBe('completed');

    // Now start streaming doneTool
    const doneToolStart: TextStreamPart<ToolSet> = {
      type: 'tool-call-streaming-start',
      toolCallId: 'done-1',
      toolName: 'doneTool',
    };
    await processor.processChunk(doneToolStart);

    // Response history should have the doneTool entry for streaming (even though it's deferred)
    expect(processor.getResponseHistory()).toHaveLength(1);
    expect(processor.getResponseHistory()[0]).toMatchObject({
      id: 'done-1',
      type: 'text',
      message: '', // Empty initially
    });

    // Stream some deltas
    const doneToolDelta: TextStreamPart<ToolSet> = {
      type: 'tool-call-delta',
      toolCallId: 'done-1',
      toolName: 'doneTool',
      argsTextDelta: '{"final_response": "This is the response"}',
    };
    await processor.processChunk(doneToolDelta);

    // Response history should still have the doneTool entry with updated content
    expect(processor.getResponseHistory()).toHaveLength(1);
    expect(processor.getResponseHistory()[0]).toMatchObject({
      id: 'done-1',
      type: 'text',
      message: 'This is the response',
    });

    // Now add file messages and doneTool response together
    const fileResponseMessages = [
      {
        id: 'file-response-1',
        type: 'file' as const,
        file_type: 'metric' as const,
        file_name: 'test-metric.yml',
        version_number: 1,
        filter_version_id: null,
        metadata: [
          {
            status: 'completed' as const,
            message: 'Metric created successfully',
            timestamp: Date.now(),
          },
        ],
      },
    ];

    await processor.addFileAndDoneToolResponses(fileResponseMessages);

    // Now response history should have both file and doneTool messages
    const responseHistory = processor.getResponseHistory();
    expect(responseHistory).toHaveLength(2);

    // File message should be first
    expect(responseHistory[0]).toMatchObject({
      id: 'file-response-1',
      type: 'file',
      file_type: 'metric',
    });

    // doneTool response should be second
    expect(responseHistory[1]).toMatchObject({
      id: 'done-1',
      type: 'text',
      message: 'This is the response',
      is_final_message: true,
    });
  });

  test('should not defer doneTool response when no completed files exist', async () => {
    // Use null messageId to avoid database saves in unit tests
    const processor = new ChunkProcessor<GenericToolSet>(null);

    // Start streaming doneTool without any files
    const doneToolStart: TextStreamPart<ToolSet> = {
      type: 'tool-call-streaming-start',
      toolCallId: 'done-1',
      toolName: 'doneTool',
    };
    await processor.processChunk(doneToolStart);

    // Response history should have the doneTool entry immediately
    expect(processor.getResponseHistory()).toHaveLength(1);
    expect(processor.getResponseHistory()[0]).toMatchObject({
      id: 'done-1',
      type: 'text',
      message: '', // Empty initially
    });

    // Stream some deltas
    const doneToolDelta: TextStreamPart<ToolSet> = {
      type: 'tool-call-delta',
      toolCallId: 'done-1',
      toolName: 'doneTool',
      argsTextDelta: '{"final_response": "Direct response"}',
    };
    await processor.processChunk(doneToolDelta);

    // Response should be updated
    expect(processor.getResponseHistory()).toHaveLength(1);
    expect(processor.getResponseHistory()[0]).toMatchObject({
      id: 'done-1',
      type: 'text',
      message: 'Direct response',
    });
  });

  test('should not defer doneTool response when files exist but are not completed', async () => {
    // Use null messageId to avoid database saves in unit tests
    const processor = new ChunkProcessor<GenericToolSet>(null);

    // Add a file that's still loading
    const fileToolCall: TextStreamPart<ToolSet> = {
      type: 'tool-call-streaming-start',
      toolCallId: 'file-1',
      toolName: 'createMetrics',
    };
    await processor.processChunk(fileToolCall);

    // Verify file is still loading
    const reasoningHistory = processor.getReasoningHistory();
    const fileEntry = reasoningHistory.find((r) => r.id === 'file-1');
    expect(fileEntry?.status).toBe('loading');

    // Start streaming doneTool
    const doneToolStart: TextStreamPart<ToolSet> = {
      type: 'tool-call-streaming-start',
      toolCallId: 'done-1',
      toolName: 'doneTool',
    };
    await processor.processChunk(doneToolStart);

    // Response history should have the doneTool entry immediately (not deferred)
    expect(processor.getResponseHistory()).toHaveLength(1);
    expect(processor.getResponseHistory()[0]).toMatchObject({
      id: 'done-1',
      type: 'text',
    });
  });
});
