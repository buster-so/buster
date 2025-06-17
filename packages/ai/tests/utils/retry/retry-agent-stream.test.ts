import type { Agent } from '@mastra/core';
import { NoSuchToolError } from 'ai';
import type { CoreMessage, StreamTextResult, ToolSet } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { detectRetryableError, retryableAgentStream } from '../../../src/utils/retry';
import type { AgentStreamOptions } from '../../../src/utils/retry/types';

// Mock agent type
type MockAgent<T extends ToolSet> = Agent<T> & {
  stream: ReturnType<typeof vi.fn>;
};

describe('detectRetryableError', () => {
  it('should detect NoSuchToolError and create healing message', () => {
    const error = new NoSuchToolError({
      toolName: 'unknownTool',
      availableTools: ['tool1', 'tool2'],
    });
    (error as never).toolCallId = 'test-call-id';

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
    (error as never).toolCallId = 'test-call-id';
    (error as never).toolName = 'testTool';

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
    } as unknown as MockAgent<ToolSet>;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];

    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as never,
    };

    const result = await retryableAgentStream({
      agent: mockAgent,
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
    (error as never).toolCallId = 'test-call-id';

    const mockAgent = {
      stream: vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(mockStream),
    } as unknown as MockAgent<ToolSet>;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];

    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as never,
    };

    const onRetry = vi.fn();

    const result = await retryableAgentStream({
      agent: mockAgent,
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
    expect(result.conversationHistory[1].role).toBe('tool');
    expect(result.conversationHistory[1].content[0]).toMatchObject({
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
    } as unknown as MockAgent<ToolSet>;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];

    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as never,
    };

    await expect(
      retryableAgentStream({
        agent: mockAgent,
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
    } as unknown as MockAgent<ToolSet>;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];

    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as never,
    };

    await expect(
      retryableAgentStream({
        agent: mockAgent,
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
    (noSuchToolError as never).toolCallId = 'call-1';

    const invalidArgsError = new Error('Invalid tool arguments');
    invalidArgsError.name = 'AI_InvalidToolArgumentsError';
    (invalidArgsError as never).toolCallId = 'call-2';
    (invalidArgsError as never).toolName = 'testTool';

    const mockAgent = {
      stream: vi
        .fn()
        .mockRejectedValueOnce(noSuchToolError)
        .mockRejectedValueOnce(invalidArgsError)
        .mockResolvedValueOnce(mockStream),
    } as unknown as MockAgent<ToolSet>;

    const messages: CoreMessage[] = [{ role: 'user', content: 'Test message' }];

    const options: AgentStreamOptions<ToolSet> = {
      runtimeContext: {} as never,
    };

    const result = await retryableAgentStream({
      agent: mockAgent,
      messages,
      options,
      retryConfig: { maxRetries: 3 },
    });

    expect(result.stream).toBe(mockStream);
    expect(result.retryCount).toBe(2);
    expect(mockAgent.stream).toHaveBeenCalledTimes(3);

    // Check that both healing messages were added
    expect(result.conversationHistory).toHaveLength(3);
    expect(result.conversationHistory[1].role).toBe('tool'); // First healing message
    expect(result.conversationHistory[2].role).toBe('tool'); // Second healing message
  });
});
