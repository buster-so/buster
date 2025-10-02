import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

// Mock the dependencies - must be before imports
vi.mock('ai', () => {
  class MockNoSuchToolError extends Error {
    toolName: string;
    availableTools: string[];

    constructor(options: { toolName: string; availableTools: string[] }) {
      super(`Tool ${options.toolName} not found`);
      this.toolName = options.toolName;
      this.availableTools = options.availableTools;
    }

    static isInstance(error: any): boolean {
      return error instanceof MockNoSuchToolError;
    }
  }

  return {
    NoSuchToolError: MockNoSuchToolError,
    generateText: vi.fn(),
    streamText: vi.fn(),
    tool: vi.fn((config: any) => config),
    stepCountIs: vi.fn((count: number) => ({ type: 'stepCount', count })),
    hasToolCall: vi.fn((toolName: string) => ({ type: 'toolCall', toolName })),
    wrapLanguageModel: vi.fn((options) => options.model),
  };
});

import { NoSuchToolError, generateText, streamText } from 'ai';
import { ANALYST_AGENT_NAME, THINK_AND_PREP_AGENT_NAME } from '../../../agents';
import type { RepairContext } from '../types';
import { canHandleNoSuchTool, repairWrongToolName } from './re-ask-strategy';

vi.mock('braintrust', () => ({
  wrapTraced: (fn: any) => fn,
  BraintrustMiddleware: vi.fn(() => ({})),
}));

vi.mock('../../../llm', () => ({
  Sonnet4: 'mock-model',
  GPT5Mini: 'mock-model',
}));

describe('re-ask-strategy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('canHandleNoSuchTool', () => {
    it('should return true for NoSuchToolError', () => {
      const error = new NoSuchToolError({
        toolName: 'nonExistentTool',
        availableTools: ['tool1', 'tool2'],
      });
      expect(canHandleNoSuchTool(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new Error('Some other error');
      expect(canHandleNoSuchTool(error)).toBe(false);
    });
  });

  describe('repairWrongToolName', () => {
    it('should re-ask and get corrected tool call', async () => {
      const mockStreamText = vi.mocked(streamText);

      const correctedToolCall = {
        toolName: 'correctTool',
        input: { param: 'value' },
      };

      mockStreamText.mockReturnValueOnce({
        textStream: (async function* () {})(),
        toolCalls: Promise.resolve([correctedToolCall]),
        text: Promise.resolve(''),
        usage: Promise.resolve({}),
      } as any);

      const context: RepairContext = {
        toolCall: {
          toolCallType: 'function',
          toolCallId: 'call123',
          toolName: 'wrongTool',
          input: { param: 'value' },
        } as any,
        tools: {
          correctTool: { inputSchema: z.object({}) },
          anotherTool: { inputSchema: z.object({}) },
        } as any,
        error: new NoSuchToolError({
          toolName: 'wrongTool',
          availableTools: ['correctTool', 'anotherTool'],
        }),
        messages: [{ role: 'user', content: 'Do something' }] as any,
        system: 'System prompt',
      };

      const result = await repairWrongToolName(context);

      expect(result).toEqual({
        type: 'tool-call',
        toolCallType: 'function',
        toolCallId: 'call123',
        toolName: 'correctTool',
        input: JSON.stringify(correctedToolCall.input), // FIXED: Now returns stringified input
      });

      // Verify the tool input is properly formatted as an object in the messages
      const calls = mockStreamText.mock.calls[0];
      const messages = calls?.[0]?.messages;
      const assistantMessage = messages?.find((m: any) => m.role === 'assistant');
      const content = assistantMessage?.content?.[0];
      if (content && typeof content === 'object' && 'input' in content) {
        expect(content.input).toEqual({ param: 'value' });
      }

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'mock-model',
          tools: context.tools,
          maxOutputTokens: 10000,
          temperature: 0,
        })
      );
    });

    it('should use analyst agent context for error message', async () => {
      const mockStreamText = vi.mocked(streamText);
      mockStreamText.mockReturnValueOnce({
        textStream: (async function* () {})(),
        toolCalls: Promise.resolve([]),
        text: Promise.resolve(''),
        usage: Promise.resolve({}),
      } as any);

      const context: RepairContext = {
        toolCall: {
          toolCallType: 'function',
          toolCallId: 'call123',
          toolName: 'executeSql',
          input: '{}',
        } as any,
        tools: {
          createMetrics: { inputSchema: z.object({}) },
          modifyMetrics: { inputSchema: z.object({}) },
        } as any,
        error: new NoSuchToolError({
          toolName: 'executeSql',
          availableTools: ['createMetrics', 'modifyMetrics'],
        }),
        messages: [],
        system: '',
        agentContext: {
          agentName: ANALYST_AGENT_NAME,
          availableTools: ['createMetrics', 'modifyMetrics'],
        },
      };

      await repairWrongToolName(context);

      const calls = mockStreamText.mock.calls[0];
      if (!calls) throw new Error('streamText not called');
      const messages = calls[0]?.messages;
      if (!messages) throw new Error('No messages found');
      const toolResultMessage = messages.find((m: any) => m.role === 'tool');
      if (!toolResultMessage) throw new Error('No tool result message found');

      // Check the error message contains the correct tool name and available tools
      const content = toolResultMessage.content[0] as any;
      const errorMessage = content.output?.value || content.value || content;
      expect(errorMessage).toContain('Tool "executeSql" is not available');
      expect(errorMessage).toContain('Available tools: createMetrics, modifyMetrics');
      expect(errorMessage).toContain(
        'The previous phase of the workflow was the think and prep phase'
      );
    });

    it('should use think-and-prep agent context for error message', async () => {
      const mockStreamText = vi.mocked(streamText);
      mockStreamText.mockReturnValueOnce({
        textStream: (async function* () {})(),
        toolCalls: Promise.resolve([]),
        text: Promise.resolve(''),
        usage: Promise.resolve({}),
      } as any);

      const context: RepairContext = {
        toolCall: {
          toolCallType: 'function',
          toolCallId: 'call123',
          toolName: 'createMetrics',
          input: '{}',
        } as any,
        tools: {
          executeSql: { inputSchema: z.object({}) },
          sequentialThinking: { inputSchema: z.object({}) },
        } as any,
        error: new NoSuchToolError({
          toolName: 'createMetrics',
          availableTools: ['executeSql', 'sequentialThinking'],
        }),
        messages: [],
        system: '',
        agentContext: {
          agentName: THINK_AND_PREP_AGENT_NAME,
          availableTools: ['executeSql', 'sequentialThinking'],
          nextPhaseTools: ['createMetrics', 'modifyMetrics'],
        },
      };

      await repairWrongToolName(context);

      const calls = mockStreamText.mock.calls[0];
      if (!calls) throw new Error('streamText not called');
      const messages = calls[0]?.messages;
      if (!messages) throw new Error('No messages found');
      const toolResultMessage = messages.find((m: any) => m.role === 'tool');
      if (!toolResultMessage) throw new Error('No tool result message found');

      // Check the error message contains the correct tool name and available tools
      const content = toolResultMessage.content[0] as any;
      const errorMessage = content.output?.value || content.value || content;
      expect(errorMessage).toContain('Tool "createMetrics" is not available');
      expect(errorMessage).toContain('Available tools: executeSql, sequentialThinking');
      expect(errorMessage).toContain('The next phase of the workflow will be the analyst');
    });

    it('should return null if no valid tool call is returned', async () => {
      const mockStreamText = vi.mocked(streamText);
      mockStreamText.mockReturnValueOnce({
        textStream: (async function* () {})(),
        toolCalls: Promise.resolve([]),
        text: Promise.resolve(''),
        usage: Promise.resolve({}),
      } as any);

      const context: RepairContext = {
        toolCall: {
          toolCallType: 'function',
          toolCallId: 'call123',
          toolName: 'wrongTool',
          input: '{}',
        } as any,
        tools: {
          correctTool: { inputSchema: z.object({}) },
        } as any,
        error: new NoSuchToolError({
          toolName: 'wrongTool',
          availableTools: ['correctTool'],
        }),
        messages: [],
        system: '',
      };

      const result = await repairWrongToolName(context);
      expect(result).toBeNull();
    });

    it('should handle errors during re-ask', async () => {
      const mockStreamText = vi.mocked(streamText);
      mockStreamText.mockImplementationOnce(() => {
        throw new Error('Generation failed');
      });

      const context: RepairContext = {
        toolCall: {
          toolCallType: 'function',
          toolCallId: 'call123',
          toolName: 'wrongTool',
          input: '{}',
        } as any,
        tools: {} as any,
        error: new NoSuchToolError({
          toolName: 'wrongTool',
          availableTools: [],
        }),
        messages: [],
        system: '',
      };

      const result = await repairWrongToolName(context);
      expect(result).toBeNull(); // Now returns null on error instead of throwing
    });

    it('should wrap non-JSON string inputs in an object', async () => {
      const mockStreamText = vi.mocked(streamText);
      mockStreamText.mockReturnValueOnce({
        textStream: (async function* () {})(),
        toolCalls: Promise.resolve([{ toolName: 'correctTool', input: { wrapped: true } }]),
        text: Promise.resolve(''),
        usage: Promise.resolve({}),
      } as any);

      const context: RepairContext = {
        toolCall: {
          toolCallType: 'function',
          toolCallId: 'call123',
          toolName: 'wrongTool',
          input: 'plain text input',
        } as any,
        tools: {
          correctTool: { inputSchema: z.object({}) },
        } as any,
        error: new NoSuchToolError({
          toolName: 'wrongTool',
          availableTools: ['correctTool'],
        }),
        messages: [],
        system: '',
      };

      await repairWrongToolName(context);

      // Verify the non-JSON string was wrapped in an object
      const calls = mockStreamText.mock.calls[0];
      const messages = calls?.[0]?.messages;
      const assistantMessage = messages?.find((m: any) => m.role === 'assistant');
      const content = assistantMessage?.content?.[0];
      if (content && typeof content === 'object' && 'input' in content) {
        expect(content.input).toEqual('plain text input'); // Now expects string input
      }
    });

    it('should handle already valid JSON string inputs', async () => {
      const mockStreamText = vi.mocked(streamText);
      mockStreamText.mockReturnValueOnce({
        textStream: (async function* () {})(),
        toolCalls: Promise.resolve([{ toolName: 'correctTool', input: { handled: true } }]),
        text: Promise.resolve(''),
        usage: Promise.resolve({}),
      } as any);

      const context: RepairContext = {
        toolCall: {
          toolCallType: 'function',
          toolCallId: 'call123',
          toolName: 'wrongTool',
          input: '{"already":"valid"}',
        } as any,
        tools: {
          correctTool: { inputSchema: z.object({}) },
        } as any,
        error: new NoSuchToolError({
          toolName: 'wrongTool',
          availableTools: ['correctTool'],
        }),
        messages: [],
        system: '',
      };

      await repairWrongToolName(context);

      // Verify the valid JSON string was parsed to an object
      const calls = mockStreamText.mock.calls[0];
      const messages = calls?.[0]?.messages;
      const assistantMessage = messages?.find((m: any) => m.role === 'assistant');
      const content = assistantMessage?.content?.[0];
      if (content && typeof content === 'object' && 'input' in content) {
        expect(content.input).toEqual({ already: 'valid' }); // Expects parsed object
      }
    });
  });
});
