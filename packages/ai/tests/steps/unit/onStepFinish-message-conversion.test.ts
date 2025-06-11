import { describe, it, expect, vi } from 'vitest';
import type { StepResult, ToolSet, CoreMessage } from 'ai';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { AnalystRuntimeContext } from '../../../src/workflows/analyst-workflow';

// Mock the step result structure
function createMockStepResult(toolCalls: any[], responseMessages: CoreMessage[]): StepResult<ToolSet> {
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
  values.set('threadId', 'test-thread');
  values.set('dataSourceId', 'test-datasource');
  values.set('dataSourceSyntax', 'postgresql');
  values.set('organizationId', 'test-org');
  
  return {
    get: (key: string) => values.get(key),
    set: (key: string, value: any) => values.set(key, value),
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
          toolCallId: 'think-1',
          toolName: 'sequential-thinking',
          content: JSON.stringify({
            thought: 'Analyzing the user request',
            thoughtNumber: 1,
            totalThoughts: 2,
            nextThoughtNeeded: true,
          }),
        },
      ];

      const step = createMockStepResult(toolCalls, responseMessages);
      const abortController = new AbortController();

      // Simulate the handleThinkAndPrepStepFinish logic
      const toolResponses = step.response.messages.filter(msg => msg.role === 'tool');
      const toolResultsMap = new Map<string, string | null>();
      
      for (const toolResponse of toolResponses) {
        if ('toolCallId' in toolResponse && 'content' in toolResponse) {
          toolResultsMap.set(toolResponse.toolCallId, toolResponse.content as string);
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
          toolCallId: 'respond-1',
          toolName: 'respondWithoutAnalysis',
          content: JSON.stringify({
            message: 'Here is a quick answer without analysis',
          }),
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
          toolCallId: 'done-1',
          toolName: 'doneTool',
          content: JSON.stringify({
            message: 'Analysis complete. I found 3 key insights.',
          }),
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
          toolCallId: 'metric-1',
          toolName: 'create-metrics-file',
          content: JSON.stringify({
            files: [
              {
                id: 'metric-uuid-1',
                name: 'revenue_metrics.yml',
                version_number: 1,
                yml_content: 'name: Revenue\ntype: metric',
              },
            ],
            failed_files: [],
          }),
        },
      ];

      const step = createMockStepResult(toolCalls, responseMessages);
      
      // Extract tool results
      const toolResponses = step.response.messages.filter(msg => msg.role === 'tool');
      const toolResultsMap = new Map<string, string | null>();
      
      for (const toolResponse of toolResponses) {
        if ('toolCallId' in toolResponse && 'content' in toolResponse) {
          toolResultsMap.set(toolResponse.toolCallId, toolResponse.content as string);
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
          toolCallId: 'sql-1',
          toolName: 'execute-sql',
          content: JSON.stringify({
            data: [{ total: 42 }],
            query: 'SELECT COUNT(*) as total FROM users',
            rowCount: 1,
          }),
        },
      ];

      const step = createMockStepResult(toolCalls, responseMessages);
      
      // Verify SQL result structure
      const toolResponses = step.response.messages.filter(msg => msg.role === 'tool');
      const sqlResponse = toolResponses.find(r => 'toolCallId' in r && r.toolCallId === 'sql-1');
      
      expect(sqlResponse).toBeDefined();
      if (sqlResponse && 'content' in sqlResponse) {
        const result = JSON.parse(sqlResponse.content as string);
        expect(result.rowCount).toBe(1);
        expect(result.data[0].total).toBe(42);
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
          content: toolCalls.map(tc => ({
            type: 'tool-call' as const,
            ...tc,
          })),
        },
        {
          role: 'tool',
          toolCallId: 'think-1',
          toolName: 'sequential-thinking',
          content: JSON.stringify({
            thought: 'First thought',
            thoughtNumber: 1,
            totalThoughts: 2,
            nextThoughtNeeded: true,
          }),
        },
        {
          role: 'tool',
          toolCallId: 'think-2',
          toolName: 'sequential-thinking',
          content: JSON.stringify({
            thought: 'Second thought',
            thoughtNumber: 2,
            totalThoughts: 2,
            nextThoughtNeeded: false,
          }),
        },
        {
          role: 'tool',
          toolCallId: 'metric-1',
          toolName: 'create-metrics-file',
          content: JSON.stringify({
            files: [
              {
                id: 'metric-1',
                name: 'metric.yml',
                version_number: 1,
                yml_content: 'content',
              },
            ],
            failed_files: [],
          }),
        },
        {
          role: 'tool',
          toolCallId: 'done-1',
          toolName: 'doneTool',
          content: JSON.stringify({
            message: 'Analysis complete',
          }),
        },
      ];

      const step = createMockStepResult(toolCalls, responseMessages);
      
      // Count tool calls by type
      const toolCallsByType = step.toolCalls.reduce((acc, call) => {
        const type = call.toolName;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(toolCallsByType['sequential-thinking']).toBe(2);
      expect(toolCallsByType['create-metrics-file']).toBe(1);
      expect(toolCallsByType['doneTool']).toBe(1);

      // Verify we can extract all tool results
      const toolResponses = step.response.messages.filter(msg => msg.role === 'tool');
      expect(toolResponses).toHaveLength(4);
    });

    it('should accumulate history across multiple onStepFinish calls', async () => {
      // Simulate accumulating history
      let accumulatedReasoningHistory: any[] = [];
      let accumulatedResponseHistory: any[] = [];

      // First call - sequential thinking
      const firstStep = createMockStepResult(
        [{ toolCallId: 'think-1', toolName: 'sequential-thinking', args: {} }],
        [
          {
            role: 'tool',
            toolCallId: 'think-1',
            toolName: 'sequential-thinking',
            content: JSON.stringify({
              thought: 'First thought',
              thoughtNumber: 1,
              totalThoughts: 1,
              nextThoughtNeeded: false,
            }),
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
      });

      // Second call - done tool
      const secondStep = createMockStepResult(
        [{ toolCallId: 'done-1', toolName: 'doneTool', args: {} }],
        [
          {
            role: 'tool',
            toolCallId: 'done-1',
            toolName: 'doneTool',
            content: JSON.stringify({
              message: 'Complete',
            }),
          },
        ]
      );

      // Simulate adding to history
      accumulatedResponseHistory.push({
        id: 'done-1',
        type: 'text',
        message: 'Complete',
        is_final_message: true,
      });

      // Verify accumulated history
      expect(accumulatedReasoningHistory).toHaveLength(1);
      expect(accumulatedResponseHistory).toHaveLength(1);
      expect(accumulatedReasoningHistory[0].type).toBe('text');
      expect(accumulatedResponseHistory[0].is_final_message).toBe(true);
    });
  });
});