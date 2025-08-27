import type { ModelMessage } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { runThinkAndPrepAgentStep } from './think-and-prep-step';

// Mock the think and prep agent module
vi.mock('../../../agents/think-and-prep-agent/think-and-prep-agent', () => ({
  createThinkAndPrepAgent: vi.fn(),
  ThinkAndPrepAgentOptionsSchema: {
    parse: (data: unknown) => data,
  },
  ThinkAndPrepStreamOptionsSchema: {
    parse: (data: unknown) => data,
  },
}));

describe('runThinkAndPrepAgentStep', () => {
  it('should successfully run think and prep agent and return messages', async () => {
    const mockMessages: ModelMessage[] = [
      { role: 'user', content: 'Test prompt' },
      { role: 'assistant', content: 'Test response' },
    ];

    const mockStream = {
      response: Promise.resolve({
        messages: mockMessages,
      }),
    };

    const mockAgent = {
      stream: vi.fn().mockResolvedValue(mockStream),
    };

    const { createThinkAndPrepAgent } = await import(
      '../../../agents/think-and-prep-agent/think-and-prep-agent'
    );
    (createThinkAndPrepAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

    const result = await runThinkAndPrepAgentStep({
      options: {
        messageId: 'test-message-id',
        workflowStartTime: Date.now(),
        sql_dialect_guidance: 'postgres',
        userId: 'test-user-id',
        chatId: 'test-chat-id',
        organizationId: 'test-organization-id',
        dataSourceId: 'test-data-source-id',
        dataSourceSyntax: 'test-data-source-syntax',
        datasets: [],
      },
      streamOptions: {
        messages: [{ role: 'user', content: 'Test prompt' }],
      },
    });

    expect(result).toEqual({ messages: mockMessages, earlyTermination: false });
    expect(mockAgent.stream).toHaveBeenCalledTimes(1);
  });

  it('should handle invalid response shape', async () => {
    const mockStream = {
      response: Promise.resolve({
        // Missing messages array
        someOtherField: 'value',
      }),
    };

    const mockAgent = {
      stream: vi.fn().mockResolvedValue(mockStream),
    };

    const { createThinkAndPrepAgent } = await import(
      '../../../agents/think-and-prep-agent/think-and-prep-agent'
    );
    (createThinkAndPrepAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

    await expect(
      runThinkAndPrepAgentStep({
        options: {
          messageId: 'test-message-id',
          workflowStartTime: Date.now(),
          sql_dialect_guidance: 'postgres',
          userId: 'test-user-id',
          chatId: 'test-chat-id',
          organizationId: 'test-organization-id',
          dataSourceId: 'test-data-source-id',
          dataSourceSyntax: 'test-data-source-syntax',
          datasets: [],
        },
        streamOptions: {
          messages: [{ role: 'user', content: 'Test prompt' }],
        },
      })
    ).rejects.toThrow(
      'Think and prep agent returned an invalid response shape (missing messages array)'
    );
  });

  it('should handle null response', async () => {
    const mockStream = {
      response: Promise.resolve(null),
    };

    const mockAgent = {
      stream: vi.fn().mockResolvedValue(mockStream),
    };

    const { createThinkAndPrepAgent } = await import(
      '../../../agents/think-and-prep-agent/think-and-prep-agent'
    );
    (createThinkAndPrepAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

    await expect(
      runThinkAndPrepAgentStep({
        options: {
          messageId: 'test-message-id',
          workflowStartTime: Date.now(),
          sql_dialect_guidance: 'postgres',
          userId: 'test-user-id',
          chatId: 'test-chat-id',
          organizationId: 'test-organization-id',
          dataSourceId: 'test-data-source-id',
          dataSourceSyntax: 'test-data-source-syntax',
          datasets: [],
        },
        streamOptions: {
          messages: [{ role: 'user', content: 'Test prompt' }],
        },
      })
    ).rejects.toThrow(
      'Think and prep agent returned an invalid response shape (missing messages array)'
    );
  });

  it('should detect early termination with messageUserClarifyingQuestion', async () => {
    const mockMessages: ModelMessage[] = [
      { role: 'user', content: 'Test prompt' },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call' as const,
            toolName: 'messageUserClarifyingQuestion',
            toolCallId: 'test-tool-call-id',
            input: { clarifying_question: 'Need more info' },
          },
        ],
      },
    ];

    const mockStream = {
      response: Promise.resolve({
        messages: mockMessages,
      }),
    };

    const mockAgent = {
      stream: vi.fn().mockResolvedValue(mockStream),
    };

    const { createThinkAndPrepAgent } = await import(
      '../../../agents/think-and-prep-agent/think-and-prep-agent'
    );
    (createThinkAndPrepAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

    const result = await runThinkAndPrepAgentStep({
      options: {
        messageId: 'test-message-id',
        workflowStartTime: Date.now(),
        sql_dialect_guidance: 'postgres',
        userId: 'test-user-id',
        chatId: 'test-chat-id',
        organizationId: 'test-organization-id',
        dataSourceId: 'test-data-source-id',
        dataSourceSyntax: 'test-data-source-syntax',
        datasets: [],
      },
      streamOptions: {
        messages: [{ role: 'user', content: 'Test prompt' }],
      },
    });

    expect(result).toEqual({ messages: mockMessages, earlyTermination: true });
  });

  it('should detect early termination with respondWithoutAssetCreation', async () => {
    const mockMessages: ModelMessage[] = [
      { role: 'user', content: 'Test prompt' },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolName: 'respondWithoutAssetCreation',
            toolCallId: 'test-tool-call-id',
            input: { final_response: 'Direct response to user' },
          },
        ],
      } as ModelMessage,
    ];

    const mockStream = {
      response: Promise.resolve({
        messages: mockMessages,
      }),
    };

    const mockAgent = {
      stream: vi.fn().mockResolvedValue(mockStream),
    };

    const { createThinkAndPrepAgent } = await import(
      '../../../agents/think-and-prep-agent/think-and-prep-agent'
    );
    (createThinkAndPrepAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

    const result = await runThinkAndPrepAgentStep({
      options: {
        messageId: 'test-message-id',
        workflowStartTime: Date.now(),
        sql_dialect_guidance: 'postgres',
        userId: 'test-user-id',
        chatId: 'test-chat-id',
        organizationId: 'test-organization-id',
        dataSourceId: 'test-data-source-id',
        dataSourceSyntax: 'test-data-source-syntax',
        datasets: [],
      },
      streamOptions: {
        messages: [{ role: 'user', content: 'Test prompt' }],
      },
    });

    expect(result).toEqual({ messages: mockMessages, earlyTermination: true });
  });

  it('should log errors with context', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockError = new Error('Test error');
    const mockAgent = {
      stream: vi.fn().mockRejectedValue(mockError),
    };

    const { createThinkAndPrepAgent } = await import(
      '../../../agents/think-and-prep-agent/think-and-prep-agent'
    );
    (createThinkAndPrepAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

    await expect(
      runThinkAndPrepAgentStep({
        options: {
          messageId: 'test-message-id',
          workflowStartTime: Date.now(),
          sql_dialect_guidance: 'postgres',
          userId: 'test-user-id',
          chatId: 'test-chat-id',
          organizationId: 'test-organization-id',
          dataSourceId: 'test-data-source-id',
          dataSourceSyntax: 'test-data-source-syntax',
          datasets: [],
        },
        streamOptions: {
          messages: [{ role: 'user', content: 'Test prompt' }],
        },
      })
    ).rejects.toThrow('Test error');

    expect(consoleErrorSpy).toHaveBeenCalledWith('runThinkAndPrepAgentStep error', {
      message: 'Test error',
      messageId: 'test-message-id',
    });

    consoleErrorSpy.mockRestore();
  });
});
