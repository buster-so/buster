import { NoSuchToolError } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { ChunkProcessor } from '../../../src/utils/database/chunk-processor';
import { handleStreamingError } from '../../../src/utils/streaming/stream-error-handler';

describe('Stream Error Integration', () => {
  it('should detect and heal NoSuchToolError during streaming', async () => {
    const error = new NoSuchToolError({
      toolName: 'invalidTool',
      availableTools: ['validTool1', 'validTool2'],
    });
    (error as never).toolCallId = 'test-call-id';

    const mockAgent = {
      tools: {
        'create-metrics-file': {},
        'execute-sql': {},
        validTool1: {},
        validTool2: {},
      },
    };

    const chunkProcessor = new ChunkProcessor('test-message', [], [], []);
    const abortController = new AbortController();
    const runtimeContext = {} as never;

    const result = await handleStreamingError(error, {
      agent: mockAgent as never,
      chunkProcessor,
      runtimeContext,
      abortController,
      maxRetries: 3,
      toolChoice: 'required',
    });

    expect(result.shouldRetry).toBe(true);
    expect(result.healingMessage).toBeDefined();
    expect(result.healingMessage?.role).toBe('tool');

    const toolResult = result.healingMessage?.content[0] as never;
    expect(toolResult?.result?.error).toContain('Tool "invalidTool" is not available');
    expect(toolResult?.result?.error).toContain('create-metrics-file');
    expect(toolResult?.result?.error).toContain('execute-sql');
    expect(toolResult?.result?.error).toContain('validTool1');
    expect(toolResult?.result?.error).toContain('validTool2');
  });

  it('should detect and heal InvalidToolArgumentsError for visualization tools', async () => {
    const error = new Error('Invalid tool arguments');
    error.name = 'AI_InvalidToolArgumentsError';
    (error as never).toolCallId = 'test-call-id';
    (error as never).toolName = 'create-metrics-file';

    // Double-escaped JSON files parameter (the actual problem)
    const doubleEscapedArgs = JSON.stringify({
      files: JSON.stringify([
        { name: 'test-metric', yml_content: 'name: Test Metric\\nsql: SELECT 1' },
      ]),
    });
    (error as never).args = doubleEscapedArgs;

    const mockAgent = {
      tools: {
        'create-metrics-file': {},
      },
    };

    const chunkProcessor = new ChunkProcessor('test-message', [], [], []);
    const abortController = new AbortController();
    const runtimeContext = {} as never;

    const result = await handleStreamingError(error, {
      agent: mockAgent as never,
      chunkProcessor,
      runtimeContext,
      abortController,
      maxRetries: 3,
      toolChoice: 'required',
    });

    expect(result.shouldRetry).toBe(true);
    expect(result.healingMessage).toBeDefined();
    expect(result.healingMessage?.role).toBe('tool');

    const toolResult = result.healingMessage?.content[0] as never;
    expect(toolResult?.result?.success).toBe(true);
    expect(toolResult?.result?.message).toContain('auto-corrected');
  });

  it('should not retry non-healable errors', async () => {
    const error = new Error('Random non-healable error');

    const mockAgent = {
      tools: {},
    };

    const chunkProcessor = new ChunkProcessor('test-message', [], [], []);
    const abortController = new AbortController();
    const runtimeContext = {} as never;

    const result = await handleStreamingError(error, {
      agent: mockAgent as never,
      chunkProcessor,
      runtimeContext,
      abortController,
      maxRetries: 3,
      toolChoice: 'required',
    });

    expect(result.shouldRetry).toBe(false);
    expect(result.healingMessage).toBeUndefined();
  });

  it('should handle InvalidToolArgumentsError for non-visualization tools', async () => {
    const error = new Error('Invalid tool arguments');
    error.name = 'AI_InvalidToolArgumentsError';
    (error as never).toolCallId = 'test-call-id';
    (error as never).toolName = 'execute-sql';
    (error as never).args = JSON.stringify({ query: 123 }); // Invalid type

    const mockAgent = {
      tools: {
        'execute-sql': {},
      },
    };

    const chunkProcessor = new ChunkProcessor('test-message', [], [], []);
    const abortController = new AbortController();
    const runtimeContext = {} as never;

    const result = await handleStreamingError(error, {
      agent: mockAgent as never,
      chunkProcessor,
      runtimeContext,
      abortController,
      maxRetries: 3,
      toolChoice: 'required',
    });

    expect(result.shouldRetry).toBe(true);
    expect(result.healingMessage).toBeDefined();
    expect(result.healingMessage?.role).toBe('tool');

    const toolResult = result.healingMessage?.content[0] as never;
    expect(toolResult?.result?.error).toContain('Invalid arguments for execute-sql');
  });
});
