import type { Agent } from '@mastra/core';
import { NoSuchToolError, ToolExecutionError } from 'ai';
import type { CoreMessage, StreamTextResult, ToolSet } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import {
  detectRetryableError,
  retryableAgentStream,
  retryableAgentStreamWithHealing,
} from '../../../src/utils/retry';
import type { AgentStreamOptions, MastraAgent } from '../../../src/utils/retry/types';
import { validateArrayAccess } from '../../../src/utils/validation-helpers';

// Mock agent type
type MockAgent = MastraAgent & {
  stream: ReturnType<typeof vi.fn>;
};

describe('detectRetryableError', () => {
  it('should detect NoSuchToolError and create healing message', () => {
    const error = new NoSuchToolError({
      toolName: 'unknownTool',
      availableTools: ['tool1', 'tool2'],
    });
    (error as any).toolCallId = 'test-call-id';

    const result = detectRetryableError(error);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('no-such-tool');
    expect(result?.healingMessage.role).toBe('tool');
    expect(result?.healingMessage.content).toHaveLength(1);
    expect(result?.healingMessage.content[0]).toMatchObject({
      type: 'tool-result',
      toolCallId: 'test-call-id',
      toolName: 'unknownTool',
      result: {
        error: expect.stringContaining('Tool "unknownTool" is not available'),
      },
    });
  });

  it('should detect InvalidToolArgumentsError and create healing message', () => {
    const error = new Error('Invalid tool arguments');
    error.name = 'AI_InvalidToolArgumentsError';
    (error as any).toolCallId = 'test-call-id';
    (error as any).toolName = 'testTool';

    const result = detectRetryableError(error);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('invalid-tool-arguments');
    expect(result?.healingMessage.role).toBe('tool');
    expect(result?.healingMessage.content).toHaveLength(1);
    expect(result?.healingMessage.content[0]).toMatchObject({
      type: 'tool-result',
      toolCallId: 'test-call-id',
      toolName: 'testTool',
      result: {
        error: expect.stringContaining('Invalid tool arguments'),
      },
    });
  });

  it('should detect empty response error and create user continue message', () => {
    const error = new Error('No tool calls generated');

    const result = detectRetryableError(error);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('empty-response');
    expect(result?.healingMessage.role).toBe('user');
    expect(result?.healingMessage.content).toBe('Please continue.');
  });

  it('should return null for non-retryable errors', () => {
    const error = new Error('Some other error');

    const result = detectRetryableError(error);

    expect(result).toBeNull();
  });
});

describe('retryableAgentStream', () => {
  it('should return stream on successful execution', async () => {
    const mockStream = { fullStream: [] } as unknown as StreamTextResult<ToolSet, unknown>;
    const mockAgent = {
      stream: vi.fn().mockResolvedValue(mockStream),
    } as unknown as MockAgent;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];

    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as never,
    };

    const result = await retryableAgentStream({
      agent: mockAgent as MastraAgent,
      messages,
      options,
    });

    expect(result.stream).toBe(mockStream);
    expect(result.conversationHistory).toEqual(messages);
    expect(result.retryCount).toBe(0);
    expect(mockAgent.stream).toHaveBeenCalledTimes(1);
  });

  it('should retry on NoSuchToolError and inject healing message', async () => {
    const mockStream = { fullStream: [] } as unknown as StreamTextResult<ToolSet, unknown>;
    const error = new NoSuchToolError({
      toolName: 'unknownTool',
      availableTools: ['tool1', 'tool2'],
    });
    (error as any).toolCallId = 'test-call-id';

    const mockAgent = {
      stream: vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(mockStream),
    } as unknown as MockAgent;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];

    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as never,
    };

    const onRetry = vi.fn();

    const result = await retryableAgentStream({
      agent: mockAgent as MastraAgent,
      messages,
      options,
      retryConfig: {
        maxRetries: 3,
        onRetry,
      },
    });

    expect(result.stream).toBe(mockStream);
    expect(result.retryCount).toBe(1);
    expect(mockAgent.stream).toHaveBeenCalledTimes(2);

    // Check that healing message was added to conversation
    expect(result.conversationHistory).toHaveLength(2);
    expect(validateArrayAccess(result.conversationHistory, 1, 'conversation history').role).toBe(
      'tool'
    );
    expect(
      validateArrayAccess(
        validateArrayAccess(result.conversationHistory, 1, 'conversation history').content as any[],
        0,
        'content'
      )
    ).toMatchObject({
      type: 'tool-result',
      toolCallId: 'test-call-id',
      toolName: 'unknownTool',
    });

    // Check that onRetry was called
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ type: 'no-such-tool' }), 1);
  });

  it('should throw error after max retries', async () => {
    const error = new NoSuchToolError({
      toolName: 'unknownTool',
      availableTools: [],
    });

    const mockAgent = {
      stream: vi.fn().mockRejectedValue(error),
    } as unknown as MockAgent;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];

    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as never,
    };

    await expect(
      retryableAgentStream({
        agent: mockAgent as MastraAgent,
        messages,
        options,
        retryConfig: { maxRetries: 2 },
      })
    ).rejects.toThrow(error);

    expect(mockAgent.stream).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should throw immediately for non-retryable errors', async () => {
    const error = new Error('Non-retryable error');

    const mockAgent = {
      stream: vi.fn().mockRejectedValue(error),
    } as unknown as MockAgent;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];

    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as never,
    };

    await expect(
      retryableAgentStream({
        agent: mockAgent as MastraAgent,
        messages,
        options,
      })
    ).rejects.toThrow(error);

    expect(mockAgent.stream).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple different retryable errors', async () => {
    const mockStream = { fullStream: [] } as unknown as StreamTextResult<ToolSet, unknown>;

    const noSuchToolError = new NoSuchToolError({
      toolName: 'unknownTool',
      availableTools: [],
    });
    (noSuchToolError as any).toolCallId = 'call-1';

    const invalidArgsError = new Error('Invalid tool arguments');
    invalidArgsError.name = 'AI_InvalidToolArgumentsError';
    (invalidArgsError as any).toolCallId = 'call-2';
    (invalidArgsError as any).toolName = 'testTool';

    const mockAgent = {
      stream: vi
        .fn()
        .mockRejectedValueOnce(noSuchToolError)
        .mockRejectedValueOnce(invalidArgsError)
        .mockResolvedValueOnce(mockStream),
    } as unknown as MockAgent;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];

    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as never,
    };

    const result = await retryableAgentStream({
      agent: mockAgent as MastraAgent,
      messages,
      options,
      retryConfig: { maxRetries: 3 },
    });

    expect(result.stream).toBe(mockStream);
    expect(result.retryCount).toBe(2);
    expect(mockAgent.stream).toHaveBeenCalledTimes(3);

    // Check that both healing messages were added
    expect(result.conversationHistory).toHaveLength(3);
    expect(validateArrayAccess(result.conversationHistory, 1, 'healing messages').role).toBe(
      'tool'
    ); // First healing message
    expect(validateArrayAccess(result.conversationHistory, 2, 'healing messages').role).toBe(
      'tool'
    ); // Second healing message
  });
});

describe('retryableAgentStreamWithHealing - In-place healing', () => {
  it('should heal NoSuchToolError through onError callback without restarting', async () => {
    const mockStream = { fullStream: [] } as unknown as StreamTextResult<ToolSet, unknown>;
    let capturedOnError: ((error: unknown) => unknown) | undefined;

    const mockAgent = {
      stream: vi.fn().mockImplementation((messages, options) => {
        // Capture the onError callback
        capturedOnError = options?.onError;
        return Promise.resolve(mockStream);
      }),
    } as unknown as MockAgent;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];
    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as never,
    };

    const onRetry = vi.fn();

    const result = await retryableAgentStreamWithHealing({
      agent: mockAgent as MastraAgent,
      messages,
      options,
      retryConfig: {
        maxRetries: 3,
        onRetry,
      },
    });

    expect(result.stream).toBe(mockStream);
    expect(mockAgent.stream).toHaveBeenCalledTimes(1);

    // Verify onError was passed
    expect(capturedOnError).toBeDefined();

    // Test that onError handles NoSuchToolError correctly
    const toolError = new NoSuchToolError({
      toolName: 'unknownTool',
      availableTools: ['tool1', 'tool2'],
    });
    (toolError as any).toolCallId = 'test-call-id';

    const errorResult = capturedOnError!(toolError);

    expect(errorResult).toEqual({
      error:
        'Tool "unknownTool" is not available. Available tools: tool1, tool2. Please use one of the available tools instead.',
    });

    // Verify onRetry was called
    expect(onRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'no-such-tool',
        originalError: toolError,
      }),
      1
    );
  });

  it('should heal InvalidToolArgumentsError with Zod details', async () => {
    const mockStream = { fullStream: [] } as unknown as StreamTextResult<ToolSet, unknown>;
    let capturedOnError: ((error: unknown) => unknown) | undefined;

    const mockAgent = {
      stream: vi.fn().mockImplementation((messages, options) => {
        capturedOnError = options?.onError;
        return Promise.resolve(mockStream);
      }),
    } as unknown as MockAgent;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];
    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as never,
    };

    await retryableAgentStreamWithHealing({
      agent: mockAgent as MastraAgent,
      messages,
      options,
    });

    // Create InvalidToolArgumentsError with Zod cause
    const invalidArgsError = new Error('Invalid tool arguments');
    invalidArgsError.name = 'AI_InvalidToolArgumentsError';
    (invalidArgsError as any).toolCallId = 'test-call-id';
    (invalidArgsError as any).toolName = 'testTool';
    (invalidArgsError as any).cause = {
      errors: [
        { path: ['field1'], message: 'Required' },
        { path: ['field2', 'subfield'], message: 'Must be a number' },
      ],
    };

    const errorResult = capturedOnError!(invalidArgsError);

    expect(errorResult).toEqual({
      error:
        'Invalid tool arguments: field1: Required, field2.subfield: Must be a number. Please check the required parameters and try again.',
    });
  });

  it('should heal ToolExecutionError', async () => {
    const mockStream = { fullStream: [] } as unknown as StreamTextResult<ToolSet, unknown>;
    let capturedOnError: ((error: unknown) => unknown) | undefined;

    const mockAgent = {
      stream: vi.fn().mockImplementation((messages, options) => {
        capturedOnError = options?.onError;
        return Promise.resolve(mockStream);
      }),
    } as unknown as MockAgent;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];

    await retryableAgentStreamWithHealing({
      agent: mockAgent as MastraAgent,
      messages,
      options: { runtimeContext: {} as never },
    });

    // Create ToolExecutionError
    const toolExecError = new ToolExecutionError({
      toolName: 'testTool',
      toolCallId: 'test-call-id',
      toolArgs: {}, // Add missing required toolArgs property
      cause: new Error('Execution failed'),
    });

    const errorResult = capturedOnError!(toolExecError);

    expect(errorResult).toEqual({
      error: 'Tool execution failed. Please check your parameters and try again.',
    });
  });

  it('should respect max healing attempts', async () => {
    const mockStream = { fullStream: [] } as unknown as StreamTextResult<ToolSet, unknown>;
    let capturedOnError: ((error: unknown) => unknown) | undefined;

    const mockAgent = {
      stream: vi.fn().mockImplementation((messages, options) => {
        capturedOnError = options?.onError;
        return Promise.resolve(mockStream);
      }),
    } as unknown as MockAgent;

    const onRetry = vi.fn();

    await retryableAgentStreamWithHealing({
      agent: mockAgent as MastraAgent,
      messages: [{ role: 'user', content: 'Test' }],
      options: { runtimeContext: {} as never },
      retryConfig: {
        maxRetries: 2,
        onRetry,
      },
    });

    const toolError = new NoSuchToolError({
      toolName: 'unknownTool',
      availableTools: [],
    });

    // First healing attempt - should work
    expect(capturedOnError!(toolError)).toBeDefined();
    expect(onRetry).toHaveBeenCalledTimes(1);

    // Second healing attempt - should work
    expect(capturedOnError!(toolError)).toBeDefined();
    expect(onRetry).toHaveBeenCalledTimes(2);

    // Third healing attempt - should exceed max retries
    const result = capturedOnError!(toolError);
    expect(result).toBeUndefined(); // Should return undefined to let error propagate
    expect(onRetry).toHaveBeenCalledTimes(2); // Should not call onRetry again
  });

  it('should let non-healable errors propagate', async () => {
    const mockStream = { fullStream: [] } as unknown as StreamTextResult<ToolSet, unknown>;
    let capturedOnError: ((error: unknown) => unknown) | undefined;

    const mockAgent = {
      stream: vi.fn().mockImplementation((messages, options) => {
        capturedOnError = options?.onError;
        return Promise.resolve(mockStream);
      }),
    } as unknown as MockAgent;

    await retryableAgentStreamWithHealing({
      agent: mockAgent as MastraAgent,
      messages: [{ role: 'user', content: 'Test' }],
      options: { runtimeContext: {} as never },
    });

    // Non-healable error
    const genericError = new Error('Some other error');
    const result = capturedOnError!(genericError);

    expect(result).toBeUndefined(); // Should return undefined to let error propagate
  });

  it('should still handle stream creation errors with retry', async () => {
    const mockStream = { fullStream: [] } as unknown as StreamTextResult<ToolSet, unknown>;
    const networkError = new Error('Network error');
    networkError.name = 'APICallError';
    (networkError as any).statusCode = 503;

    const mockAgent = {
      stream: vi.fn().mockRejectedValueOnce(networkError).mockResolvedValueOnce(mockStream),
    } as unknown as MockAgent;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];
    const onRetry = vi.fn();

    const result = await retryableAgentStreamWithHealing({
      agent: mockAgent as MastraAgent,
      messages,
      options: { runtimeContext: {} as never },
      retryConfig: {
        maxRetries: 3,
        onRetry,
        exponentialBackoff: false, // Disable for faster tests
      },
    });

    expect(result.stream).toBe(mockStream);
    expect(mockAgent.stream).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledTimes(1);

    // Check that healing message was added for stream creation error
    expect(result.conversationHistory).toHaveLength(2);
    expect(result.conversationHistory[1]).toEqual({
      role: 'user',
      content: 'Server temporarily unavailable, retrying...',
    });
  });
});
