import type { TextStreamPart, ToolSet } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChunkProcessor } from '../../../src/utils/database/chunk-processor';

// Mock the database update function
vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn().mockResolvedValue(undefined),
}));

describe('ChunkProcessor - Escape Normalization', () => {
  let processor: ChunkProcessor<ToolSet>;

  beforeEach(() => {
    processor = new ChunkProcessor<ToolSet>('test-message-id');
  });

  it('should normalize double-escaped newlines in sequential thinking tool', async () => {
    // Start of tool call
    await processor.processChunk({
      type: 'tool-call-streaming-start',
      toolCallId: 'call-1',
      toolName: 'sequential-thinking',
    } as TextStreamPart<ToolSet>);

    // Stream chunks with double-escaped content
    await processor.processChunk({
      type: 'tool-call-delta',
      toolCallId: 'call-1',
      argsTextDelta: '{"thought":"Looking at the data:\\\\n- First point\\\\n- Second point',
    } as TextStreamPart<ToolSet>);

    await processor.processChunk({
      type: 'tool-call-delta',
      toolCallId: 'call-1',
      argsTextDelta: '\\\\n\\\\nI should analyze this further","nextThoughtNeeded":true}',
    } as TextStreamPart<ToolSet>);

    // Complete the tool call
    await processor.processChunk({
      type: 'tool-call',
      toolCallId: 'call-1',
      toolName: 'sequential-thinking',
      args: {
        thought:
          'Looking at the data:\\\\n- First point\\\\n- Second point\\\\n\\\\nI should analyze this further',
        nextThoughtNeeded: true,
      },
    } as TextStreamPart<ToolSet>);

    // Get reasoning history
    const reasoningHistory = processor.getReasoningHistory();

    // Verify the thought was normalized
    expect(reasoningHistory).toHaveLength(1);
    const reasoningEntry = reasoningHistory[0];
    expect(reasoningEntry?.type).toBe('text');
    if (reasoningEntry?.type === 'text') {
      expect(reasoningEntry.message).toBe(
        'Looking at the data:\n- First point\n- Second point\n\nI should analyze this further'
      );
      expect(reasoningEntry.message).not.toContain('\\\\n');
    }
  });

  it('should normalize double-escaped content in submitThoughts tool', async () => {
    // Start of tool call
    await processor.processChunk({
      type: 'tool-call-streaming-start',
      toolCallId: 'call-2',
      toolName: 'submitThoughts',
    } as TextStreamPart<ToolSet>);

    // Stream chunks with double-escaped content
    await processor.processChunk({
      type: 'tool-call-delta',
      toolCallId: 'call-2',
      argsTextDelta:
        '{"thoughts":"Analysis complete:\\\\n\\\\n1. Found customer data\\\\n2. Identified relationships"}',
    } as TextStreamPart<ToolSet>);

    // Complete the tool call
    await processor.processChunk({
      type: 'tool-call',
      toolCallId: 'call-2',
      toolName: 'submitThoughts',
      args: {
        thoughts:
          'Analysis complete:\\\\n\\\\n1. Found customer data\\\\n2. Identified relationships',
      },
    } as TextStreamPart<ToolSet>);

    // Get reasoning history
    const reasoningHistory = processor.getReasoningHistory();

    // Verify the thoughts were normalized
    expect(reasoningHistory).toHaveLength(1);
    const reasoningEntry = reasoningHistory[0];
    expect(reasoningEntry?.type).toBe('text');
    if (reasoningEntry?.type === 'text') {
      expect(reasoningEntry.message).toBe(
        'Analysis complete:\n\n1. Found customer data\n2. Identified relationships'
      );
      expect(reasoningEntry.message).not.toContain('\\\\n');
    }
  });

  it('should handle mixed escape sequences correctly', async () => {
    await processor.processChunk({
      type: 'tool-call',
      toolCallId: 'call-3',
      toolName: 'sequential-thinking',
      args: {
        thought: 'Text with:\\\\n- Newlines\\\\t- Tabs\\\\"Quotes\\\\"',
        nextThoughtNeeded: false,
      },
    } as TextStreamPart<ToolSet>);

    const reasoningHistory = processor.getReasoningHistory();
    const reasoningEntry = reasoningHistory[0];
    if (reasoningEntry?.type === 'text') {
      expect(reasoningEntry.message).toBe('Text with:\n- Newlines\t- Tabs"Quotes"');
    }
  });

  it('should not modify properly escaped text', async () => {
    await processor.processChunk({
      type: 'tool-call',
      toolCallId: 'call-4',
      toolName: 'sequential-thinking',
      args: {
        thought: 'Already properly formatted text\nWith real newlines\tand tabs',
        nextThoughtNeeded: false,
      },
    } as TextStreamPart<ToolSet>);

    const reasoningHistory = processor.getReasoningHistory();
    const reasoningEntry = reasoningHistory[0];
    if (reasoningEntry?.type === 'text') {
      expect(reasoningEntry.message).toBe(
        'Already properly formatted text\nWith real newlines\tand tabs'
      );
    }
  });
});
