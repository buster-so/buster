import { NoSuchToolError } from 'ai';
import { describe, expect, it } from 'vitest';
import { ChunkProcessor } from '../../../src/utils/database/chunk-processor';
import { handleStreamingError } from '../../../src/utils/streaming/stream-error-handler';

describe('Stream Error Integration', () => {
  it('should detect and heal NoSuchToolError during streaming', async () => {
    const error = new NoSuchToolError({
      toolName: 'invalidTool',
      availableTools: ['validTool1', 'validTool2'],
    });
    // biome-ignore lint/suspicious/noExplicitAny: Creating mock error object for testing
    (error as any).toolCallId = 'test-call-id';

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
    // biome-ignore lint/suspicious/noExplicitAny: Mock runtime context for testing
    const runtimeContext = {} as any;

    const result = await handleStreamingError(error, {
      // biome-ignore lint/suspicious/noExplicitAny: Mock agent for testing
      agent: mockAgent as any,
      chunkProcessor,
      runtimeContext,
      abortController,
      maxRetries: 3,
      toolChoice: 'required',
    });

    expect(result.shouldRetry).toBe(true);
    expect(result.healingMessage).toBeDefined();
    expect(result.healingMessage?.role).toBe('tool');

    // biome-ignore lint/suspicious/noExplicitAny: Accessing mock result for testing
    const toolResult = result.healingMessage?.content[0] as any;
    expect(toolResult?.result?.error).toContain('Tool "invalidTool" is not available');
    expect(toolResult?.result?.error).toContain('create-metrics-file');
    expect(toolResult?.result?.error).toContain('execute-sql');
    expect(toolResult?.result?.error).toContain('validTool1');
    expect(toolResult?.result?.error).toContain('validTool2');
  });

  it('should detect and heal InvalidToolArgumentsError for visualization tools', async () => {
    const error = new Error('Invalid tool arguments');
    error.name = 'AI_InvalidToolArgumentsError';
    // biome-ignore lint/suspicious/noExplicitAny: Creating mock error object for testing
    (error as any).toolCallId = 'test-call-id';
    // biome-ignore lint/suspicious/noExplicitAny: Creating mock error object for testing
    (error as any).toolName = 'create-metrics-file';

    // Double-escaped JSON files parameter (the actual problem)
    const doubleEscapedArgs = JSON.stringify({
      files: JSON.stringify([
        { name: 'test-metric', yml_content: 'name: Test Metric\\nsql: SELECT 1' },
      ]),
    });
    // biome-ignore lint/suspicious/noExplicitAny: Creating mock error object for testing
    (error as any).args = doubleEscapedArgs;

    const mockAgent = {
      tools: {
        'create-metrics-file': {},
      },
    };

    const chunkProcessor = new ChunkProcessor('test-message', [], [], []);
    const abortController = new AbortController();
    // biome-ignore lint/suspicious/noExplicitAny: Mock runtime context for testing
    const runtimeContext = {} as any;

    const result = await handleStreamingError(error, {
      // biome-ignore lint/suspicious/noExplicitAny: Mock agent for testing
      agent: mockAgent as any,
      chunkProcessor,
      runtimeContext,
      abortController,
      maxRetries: 3,
      toolChoice: 'required',
    });

    expect(result.shouldRetry).toBe(true);
    expect(result.healingMessage).toBeDefined();
    expect(result.healingMessage?.role).toBe('tool');

    // biome-ignore lint/suspicious/noExplicitAny: Accessing mock result for testing
    const toolResult = result.healingMessage?.content[0] as any;
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
    // biome-ignore lint/suspicious/noExplicitAny: Mock runtime context for testing
    const runtimeContext = {} as any;

    const result = await handleStreamingError(error, {
      // biome-ignore lint/suspicious/noExplicitAny: Mock agent for testing
      agent: mockAgent as any,
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
    // biome-ignore lint/suspicious/noExplicitAny: Creating mock error object for testing
    (error as any).toolCallId = 'test-call-id';
    // biome-ignore lint/suspicious/noExplicitAny: Creating mock error object for testing
    (error as any).toolName = 'execute-sql';
    // biome-ignore lint/suspicious/noExplicitAny: Creating mock error object for testing
    (error as any).args = JSON.stringify({ query: 123 }); // Invalid type

    const mockAgent = {
      tools: {
        'execute-sql': {},
      },
    };

    const chunkProcessor = new ChunkProcessor('test-message', [], [], []);
    const abortController = new AbortController();
    // biome-ignore lint/suspicious/noExplicitAny: Mock runtime context for testing
    const runtimeContext = {} as any;

    const result = await handleStreamingError(error, {
      // biome-ignore lint/suspicious/noExplicitAny: Mock agent for testing
      agent: mockAgent as any,
      chunkProcessor,
      runtimeContext,
      abortController,
      maxRetries: 3,
      toolChoice: 'required',
    });

    expect(result.shouldRetry).toBe(true);
    expect(result.healingMessage).toBeDefined();
    expect(result.healingMessage?.role).toBe('tool');

    // biome-ignore lint/suspicious/noExplicitAny: Accessing mock result for testing
    const toolResult = result.healingMessage?.content[0] as any;
    expect(toolResult?.result?.error).toContain('Invalid arguments for execute-sql');
  });
});
