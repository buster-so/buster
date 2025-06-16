import type { Agent } from '@mastra/core';
import { NoSuchToolError } from 'ai';
import type { CoreMessage, StreamTextResult, ToolSet } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { retryableAgentStreamWithHealing } from '../../../src/utils/retry';
import type { AgentStreamOptions } from '../../../src/utils/retry/types';

// Mock agent type with tools
type MockAgentWithTools<T extends ToolSet> = Agent<T> & {
  stream: ReturnType<typeof vi.fn>;
  tools: T;
};

/**
 * Creates a mock stream that throws a specific error during iteration
 */
function createStreamWithError(error: Error): StreamTextResult<ToolSet, unknown> {
  return {
    fullStream: (async function* () {
      // Yield a few chunks first, then throw the error
      yield { type: 'text-delta', textDelta: 'Hello' };
      yield { type: 'text-delta', textDelta: ' world' };
      throw error;
    })(),
  } as unknown as StreamTextResult<ToolSet, unknown>;
}

/**
 * Creates a mock stream that succeeds
 */
function createSuccessfulStream(): StreamTextResult<ToolSet, unknown> {
  return {
    fullStream: (async function* () {
      yield { type: 'text-delta', textDelta: 'Success!' };
      yield { type: 'finish', finishReason: 'stop' };
    })(),
  } as unknown as StreamTextResult<ToolSet, unknown>;
}

/**
 * Creates a mock InvalidToolArgumentsError with double-escaped JSON
 */
function createInvalidToolArgumentsError(
  toolName: string,
  toolCallId: string,
  doubleEscapedFiles: string
): Error {
  const error = new Error('Invalid tool arguments');
  error.name = 'AI_InvalidToolArgumentsError';
  (error as any).toolCallId = toolCallId;
  (error as any).toolName = toolName;
  (error as any).args = JSON.stringify({ files: doubleEscapedFiles });
  return error;
}

describe('retryableAgentStreamWithHealing', () => {
  it('should handle NoSuchToolError at stream creation and provide available tools', async () => {
    const error = new NoSuchToolError({
      toolName: 'badTool',
      availableTools: ['tool1', 'tool2'],
    });
    (error as any).toolCallId = 'test-call-id';

    const mockAgent = {
      stream: vi
        .fn()
        .mockRejectedValueOnce(error) // Reject at stream creation, not during streaming
        .mockResolvedValueOnce(createSuccessfulStream()),
      tools: {
        'create-metrics-file': {},
        'execute-sql': {},
      },
    } as unknown as MockAgentWithTools<ToolSet>;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];
    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as any,
    };

    const onRetry = vi.fn();

    const result = await retryableAgentStreamWithHealing({
      agent: mockAgent,
      messages,
      options,
      retryConfig: {
        maxRetries: 3,
        onRetry,
      },
    });

    expect(result.retryCount).toBe(1);
    expect(mockAgent.stream).toHaveBeenCalledTimes(2);

    // Verify healing message was added to conversation
    expect(result.conversationHistory).toHaveLength(2);
    expect(result.conversationHistory[1].role).toBe('tool');
    expect(result.conversationHistory[1].content[0]).toMatchObject({
      type: 'tool-result',
      toolCallId: 'test-call-id',
      toolName: 'badTool',
      result: {
        error: expect.stringContaining('Tool "badTool" is not available'),
      },
    });

    // Verify onRetry was called
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ type: 'no-such-tool' }), 1);
  });

  it('should heal double-escaped JSON in visualization tools at stream creation', async () => {
    // Create a double-escaped JSON files parameter (the actual problem we're solving)
    const doubleEscapedFiles = JSON.stringify([
      { name: 'test-metric', yml_content: 'name: Test\\nsql: SELECT 1' },
    ]);

    const error = createInvalidToolArgumentsError(
      'create-metrics-file',
      'test-call-id',
      doubleEscapedFiles
    );

    const mockAgent = {
      stream: vi
        .fn()
        .mockRejectedValueOnce(error) // Reject at stream creation
        .mockResolvedValueOnce(createSuccessfulStream()),
      tools: {
        'create-metrics-file': {},
        'modify-dashboards-file': {},
      },
    } as unknown as MockAgentWithTools<ToolSet>;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Create a metric' }];
    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as any,
    };

    const onRetry = vi.fn();

    const result = await retryableAgentStreamWithHealing({
      agent: mockAgent,
      messages,
      options,
      retryConfig: {
        maxRetries: 3,
        onRetry,
      },
    });

    expect(result.retryCount).toBe(1);
    expect(mockAgent.stream).toHaveBeenCalledTimes(2);

    // Verify healing message was added
    expect(result.conversationHistory).toHaveLength(2);
    expect(result.conversationHistory[1].role).toBe('tool');
    expect(result.conversationHistory[1].content[0]).toMatchObject({
      type: 'tool-result',
      toolCallId: 'test-call-id',
      toolName: 'create-metrics-file',
      result: {
        success: true,
        message: expect.stringContaining('auto-corrected'),
      },
    });

    // Verify onRetry was called
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'invalid-tool-arguments' }),
      1
    );
  });

  it('should provide generic error message for non-visualization tools', async () => {
    const error = new Error('Invalid tool arguments');
    error.name = 'AI_InvalidToolArgumentsError';
    (error as any).toolCallId = 'test-call-id';
    (error as any).toolName = 'execute-sql';
    (error as any).args = JSON.stringify({ query: 123 }); // wrong type

    const mockAgent = {
      stream: vi
        .fn()
        .mockRejectedValueOnce(error) // Reject at stream creation
        .mockResolvedValueOnce(createSuccessfulStream()),
      tools: {
        'execute-sql': {},
      },
    } as unknown as MockAgentWithTools<ToolSet>;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Execute SQL' }];
    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as any,
    };

    const result = await retryableAgentStreamWithHealing({
      agent: mockAgent,
      messages,
      options,
    });

    expect(result.retryCount).toBe(1);

    // Verify error message was provided (not healed)
    const toolResult = result.conversationHistory[1].content[0] as any;
    expect(toolResult?.result?.error).toContain('Invalid arguments for execute-sql');
  });

  it('should handle multiple different errors in sequence', async () => {
    const noSuchToolError = new NoSuchToolError({
      toolName: 'badTool',
      availableTools: [],
    });
    (noSuchToolError as any).toolCallId = 'call-1';

    const invalidArgsError = createInvalidToolArgumentsError(
      'create-dashboards-file',
      'call-2',
      JSON.stringify([{ name: 'test' }])
    );

    const mockAgent = {
      stream: vi
        .fn()
        .mockRejectedValueOnce(noSuchToolError) // First error at stream creation
        .mockRejectedValueOnce(invalidArgsError) // Second error at stream creation
        .mockResolvedValueOnce(createSuccessfulStream()),
      tools: {
        'create-dashboards-file': {},
        'execute-sql': {},
      },
    } as unknown as MockAgentWithTools<ToolSet>;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];
    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as any,
    };

    const result = await retryableAgentStreamWithHealing({
      agent: mockAgent,
      messages,
      options,
      retryConfig: { maxRetries: 3 },
    });

    expect(result.retryCount).toBe(2);
    expect(mockAgent.stream).toHaveBeenCalledTimes(3);

    // Should have both healing messages
    expect(result.conversationHistory).toHaveLength(3);
    expect(result.conversationHistory[1].role).toBe('tool'); // First healing message
    expect(result.conversationHistory[2].role).toBe('tool'); // Second healing message
  });

  it('should throw after max retries for errors', async () => {
    const error = new NoSuchToolError({
      toolName: 'badTool',
      availableTools: [],
    });

    const mockAgent = {
      stream: vi.fn().mockRejectedValue(error), // Always reject
      tools: {},
    } as unknown as MockAgentWithTools<ToolSet>;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];
    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as any,
    };

    await expect(
      retryableAgentStreamWithHealing({
        agent: mockAgent,
        messages,
        options,
        retryConfig: { maxRetries: 2 },
      })
    ).rejects.toThrow();

    expect(mockAgent.stream).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should throw immediately for non-healable errors', async () => {
    const error = new Error('Non-healable error');

    const mockAgent = {
      stream: vi.fn().mockRejectedValue(error), // Reject at stream creation
      tools: {},
    } as unknown as MockAgentWithTools<ToolSet>;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];
    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as any,
    };

    await expect(
      retryableAgentStreamWithHealing({
        agent: mockAgent,
        messages,
        options,
      })
    ).rejects.toThrow('Non-healable error');

    expect(mockAgent.stream).toHaveBeenCalledTimes(1); // No retries
  });

  it('should work normally when no errors occur', async () => {
    const mockAgent = {
      stream: vi.fn().mockResolvedValue(createSuccessfulStream()),
      tools: {},
    } as unknown as MockAgentWithTools<ToolSet>;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];
    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as any,
    };

    const result = await retryableAgentStreamWithHealing({
      agent: mockAgent,
      messages,
      options,
    });

    expect(result.retryCount).toBe(0);
    expect(result.conversationHistory).toEqual(messages);
    expect(mockAgent.stream).toHaveBeenCalledTimes(1);
  });
});
