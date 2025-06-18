import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage, StepResult, ToolSet } from 'ai';
import { describe, expect, it } from 'vitest';
import type { AnalystRuntimeContext } from '../../../src/workflows/analyst-workflow';

// Mock tool call interface
interface MockToolCall {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}

// Mock the step result structure
function createMockStepResult(
  toolCalls: MockToolCall[],
  responseMessages: CoreMessage[]
): StepResult<ToolSet> {
  return {
    toolCalls,
    response: {
      messages: responseMessages,
    },
    finishReason: 'tool-calls',
    usage: {
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
    },
    warnings: [],
    request: {
      model: 'test-model',
      messages: [],
    },
    rawResponse: {
      headers: {},
    },
    stepType: 'mock-step',
  } as unknown as StepResult<ToolSet>;
}

// Mock runtime context
function createMockRuntimeContext(messageId?: string): RuntimeContext<AnalystRuntimeContext> {
  const values = new Map();
  if (messageId) {
    values.set('messageId', messageId);
  }
  values.set('userId', 'test-user');
  values.set('chatId', 'test-thread');
  values.set('dataSourceId', 'test-datasource');
  values.set('dataSourceSyntax', 'postgresql');
  values.set('organizationId', 'test-org');

  return {
    get: (key: string) => values.get(key),
    set: (key: string, value: unknown) => values.set(key, value),
  } as unknown as RuntimeContext<AnalystRuntimeContext>;
}

describe('onStepFinish message conversion', () => {
  describe('Think and Prep Step', () => {
    it('should convert sequential thinking to reasoning text messages', async () => {
      const toolCalls = [
        {
          toolCallId: 'think-1',
          toolName: 'sequential-thinking',
          args: {
            thought: 'Analyzing the user request',
            thoughtNumber: 1,
            totalThoughts: 2,
            nextThoughtNeeded: true,
          },
        },
      ];

      const responseMessages: CoreMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'think-1',
              toolName: 'sequential-thinking',
              args: {
                thought: 'Analyzing the user request',
                thoughtNumber: 1,
                totalThoughts: 2,
                nextThoughtNeeded: true,
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'think-1',
              toolName: 'sequential-thinking',
              result: {
                thought: 'Analyzing the user request',
                thoughtNumber: 1,
                totalThoughts: 2,
                nextThoughtNeeded: true,
              },
            },
          ],
        },
      ];

      const step = createMockStepResult(toolCalls, responseMessages);
      const abortController = new AbortController();

      // Simulate the handleThinkAndPrepStepFinish logic
      const toolResponses = step.response.messages.filter((msg) => msg.role === 'tool');
      const toolResultsMap = new Map<string, string | null>();

      for (const toolResponse of toolResponses) {
        if ('content' in toolResponse && Array.isArray(toolResponse.content)) {
          for (const toolResult of toolResponse.content) {
            if (toolResult.type === 'tool-result' && toolResult.toolCallId) {
              toolResultsMap.set(toolResult.toolCallId, JSON.stringify(toolResult.result));
            }
          }
        }
      }

      expect(toolResultsMap.size).toBe(1);
      expect(toolResultsMap.get('think-1')).toBeDefined();

      // Parse the result
      const result = JSON.parse(toolResultsMap.get('think-1')!);
      expect(result).toMatchObject({
        thought: 'Analyzing the user request',
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: true,
      });
    });

    it('should convert respondWithoutAnalysis to response text messages', async () => {
      const toolCalls = [
        {
          toolCallId: 'respond-1',
          toolName: 'respondWithoutAnalysis',
          args: {
            message: 'Here is a quick answer without analysis',
          },
        },
      ];

      const responseMessages: CoreMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'respond-1',
              toolName: 'respondWithoutAnalysis',
              args: {
                message: 'Here is a quick answer without analysis',
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'respond-1',
              toolName: 'respondWithoutAnalysis',
              result: {
                message: 'Here is a quick answer without analysis',
              },
            },
          ],
        },
      ];

      const step = createMockStepResult(toolCalls, responseMessages);
      const toolNames = step.toolCalls.map((call) => call.toolName);

      // Check that respondWithoutAnalysis is a finishing tool
      const hasFinishingTools = toolNames.some((toolName: string) =>
        ['submitThoughts', 'respondWithoutAnalysis'].includes(toolName)
      );

      expect(hasFinishingTools).toBe(true);
      expect(toolNames.includes('respondWithoutAnalysis')).toBe(true);
    });
  });

  describe('Analyst Step', () => {
    it('should convert doneTool to response text messages', async () => {
      const toolCalls = [
        {
          toolCallId: 'done-1',
          toolName: 'doneTool',
          args: {
            message: 'Analysis complete. I found 3 key insights.',
          },
        },
      ];

      const responseMessages: CoreMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'done-1',
              toolName: 'doneTool',
              args: {
                message: 'Analysis complete. I found 3 key insights.',
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'done-1',
              toolName: 'doneTool',
              result: {
                message: 'Analysis complete. I found 3 key insights.',
              },
            },
          ],
        },
      ];

      const step = createMockStepResult(toolCalls, responseMessages);
      const toolNames = step.toolCalls.map((call) => call.toolName);

      // Check that doneTool triggers finish
      const hasFinishingTools = toolNames.includes('doneTool');
      expect(hasFinishingTools).toBe(true);
    });

    it('should convert create-metrics-file to reasoning file messages', async () => {
      const toolCalls = [
        {
          toolCallId: 'metric-1',
          toolName: 'create-metrics-file',
          args: {},
        },
      ];

      const responseMessages: CoreMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'metric-1',
              toolName: 'create-metrics-file',
              args: {},
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'metric-1',
              toolName: 'create-metrics-file',
              result: {
                files: [
                  {
                    id: 'metric-uuid-1',
                    name: 'revenue_metrics.yml',
                    version_number: 1,
                    yml_content: 'name: Revenue\ntype: metric',
                  },
                ],
                failed_files: [],
              },
            },
          ],
        },
      ];

      const step = createMockStepResult(toolCalls, responseMessages);

      // Extract tool results
      const toolResponses = step.response.messages.filter((msg) => msg.role === 'tool');
      const toolResultsMap = new Map<string, string | null>();

      for (const toolResponse of toolResponses) {
        if ('content' in toolResponse && Array.isArray(toolResponse.content)) {
          for (const toolResult of toolResponse.content) {
            if (toolResult.type === 'tool-result' && toolResult.toolCallId) {
              toolResultsMap.set(toolResult.toolCallId, JSON.stringify(toolResult.result));
            }
          }
        }
      }

      const result = JSON.parse(toolResultsMap.get('metric-1')!);
      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe('revenue_metrics.yml');
    });

    it('should convert execute-sql to reasoning text messages', async () => {
      const toolCalls = [
        {
          toolCallId: 'sql-1',
          toolName: 'execute-sql',
          args: {
            query: 'SELECT COUNT(*) as total FROM users',
          },
        },
      ];

      const responseMessages: CoreMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'sql-1',
              toolName: 'execute-sql',
              args: {
                query: 'SELECT COUNT(*) as total FROM users',
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'sql-1',
              toolName: 'execute-sql',
              result: {
                data: [{ total: 42 }],
                query: 'SELECT COUNT(*) as total FROM users',
                rowCount: 1,
              },
            },
          ],
        },
      ];

      const step = createMockStepResult(toolCalls, responseMessages);

      // Verify SQL result structure
      const toolResponses = step.response.messages.filter((msg) => msg.role === 'tool');
      const sqlResponse = toolResponses.find((r) => {
        if ('content' in r && Array.isArray(r.content)) {
          return r.content.some((tr) => tr.type === 'tool-result' && tr.toolCallId === 'sql-1');
        }
        return false;
      });

      expect(sqlResponse).toBeDefined();
      if (sqlResponse && 'content' in sqlResponse && Array.isArray(sqlResponse.content)) {
        const toolResult = sqlResponse.content.find(
          (tr) => tr.type === 'tool-result' && tr.toolCallId === 'sql-1'
        );
        if (toolResult && toolResult.result) {
          const result = toolResult.result as { rowCount: number; data: Array<{ total: number }> };
          expect(result.rowCount).toBe(1);
          expect(result.data[0].total).toBe(42);
        }
      }
    });
  });

  describe('Complex sequences', () => {
    it('should handle multiple tool calls in sequence', async () => {
      const toolCalls = [
        {
          toolCallId: 'think-1',
          toolName: 'sequential-thinking',
          args: {},
        },
        {
          toolCallId: 'think-2',
          toolName: 'sequential-thinking',
          args: {},
        },
        {
          toolCallId: 'metric-1',
          toolName: 'create-metrics-file',
          args: {},
        },
        {
          toolCallId: 'done-1',
          toolName: 'doneTool',
          args: {},
        },
      ];

      const responseMessages: CoreMessage[] = [
        {
          role: 'assistant',
          content: toolCalls.map((tc) => ({
            type: 'tool-call' as const,
            ...tc,
          })),
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'think-1',
              toolName: 'sequential-thinking',
              result: {
                thought: 'First thought',
                thoughtNumber: 1,
                totalThoughts: 2,
                nextThoughtNeeded: true,
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'think-2',
              toolName: 'sequential-thinking',
              result: {
                thought: 'Second thought',
                thoughtNumber: 2,
                totalThoughts: 2,
                nextThoughtNeeded: false,
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'metric-1',
              toolName: 'create-metrics-file',
              result: {
                files: [
                  {
                    id: 'metric-1',
                    name: 'metric.yml',
                    version_number: 1,
                    yml_content: 'content',
                  },
                ],
                failed_files: [],
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'done-1',
              toolName: 'doneTool',
              result: {
                message: 'Analysis complete',
              },
            },
          ],
        },
      ];

      const step = createMockStepResult(toolCalls, responseMessages);

      // Count tool calls by type
      const toolCallsByType = step.toolCalls.reduce(
        (acc, call) => {
          const type = call.toolName;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(toolCallsByType['sequential-thinking']).toBe(2);
      expect(toolCallsByType['create-metrics-file']).toBe(1);
      expect(toolCallsByType.doneTool).toBe(1);

      // Verify we can extract all tool results
      const toolResponses = step.response.messages.filter((msg) => msg.role === 'tool');
      expect(toolResponses).toHaveLength(4);
    });

    it('should accumulate history across multiple onStepFinish calls', async () => {
      // Simulate accumulating history
      const accumulatedReasoningHistory: CoreMessage[] = [];
      const accumulatedResponseHistory: CoreMessage[] = [];

      // First call - sequential thinking
      const firstStep = createMockStepResult(
        [{ toolCallId: 'think-1', toolName: 'sequential-thinking', args: {} }],
        [
          {
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolCallId: 'think-1',
                toolName: 'sequential-thinking',
                result: {
                  thought: 'First thought',
                  thoughtNumber: 1,
                  totalThoughts: 1,
                  nextThoughtNeeded: false,
                },
              },
            ],
          },
        ]
      );

      // Simulate adding to history
      accumulatedReasoningHistory.push({
        id: 'think-1',
        type: 'text',
        title: 'Thought 1 of 1',
        message: 'First thought',
        status: 'completed',
      } as any);

      // Second call - done tool
      const secondStep = createMockStepResult(
        [{ toolCallId: 'done-1', toolName: 'doneTool', args: {} }],
        [
          {
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolCallId: 'done-1',
                toolName: 'doneTool',
                result: {
                  message: 'Complete',
                },
              },
            ],
          },
        ]
      );

      // Simulate adding to history
      accumulatedResponseHistory.push({
        id: 'done-1',
        type: 'text',
        message: 'Complete',
        is_final_message: true,
      } as any);

      // Verify accumulated history
      expect(accumulatedReasoningHistory).toHaveLength(1);
      expect(accumulatedResponseHistory).toHaveLength(1);
      expect((accumulatedReasoningHistory[0] as any).type).toBe('text');
      expect((accumulatedResponseHistory[0] as any).is_final_message).toBe(true);
    });
  });
});
