import type { AssistantContent } from 'ai';
import { describe, expect, it } from 'vitest';
import {
  type BusterChatMessageReasoning_files,
  type BusterChatMessageReasoning_text,
  type BusterChatResponseMessage_text,
  convertToolCallToMessage,
  extractMessagesFromToolCalls,
} from '../../../src/utils/memory/message-converters';

// Extract ToolCall type from AssistantContent
type ToolCall = Extract<AssistantContent, { type: 'tool-call' }>;

// Helper to create a ToolCall object
function createToolCall(
  toolCallId: string,
  toolName: string,
  args: Record<string, unknown>
): ToolCall {
  return {
    type: 'tool-call' as const,
    toolCallId,
    toolName,
    args,
  };
}

describe('message-converters', () => {
  describe('convertToolCallToMessage', () => {
    describe('DUN tool (doneTool)', () => {
      it('should convert doneTool to response text message', () => {
        const toolCall = createToolCall('test-id-1', 'doneTool', { message: 'Analysis complete' });
        const toolResult = { message: 'Analysis complete' };

        const result = convertToolCallToMessage(toolCall, toolResult, 'completed');

        expect(result).not.toBeNull();
        expect(result?.type).toBe('response');
        expect(result?.message).toMatchObject({
          id: 'test-id-1',
          type: 'text',
          message: 'Analysis complete',
          is_final_message: true,
        } as BusterChatResponseMessage_text);
      });

      it('should handle done-tool alias', () => {
        const toolCall = createToolCall('test-id-2', 'done-tool', { message: 'Done!' });
        const toolResult = { message: 'Done!' };

        const result = convertToolCallToMessage(toolCall, toolResult, 'completed');

        expect(result).not.toBeNull();
        expect(result?.type).toBe('response');
      });
    });

    describe('Respond Without Analysis tool', () => {
      it('should convert respondWithoutAnalysis to response text message', () => {
        const toolCall = createToolCall('test-id-3', 'respondWithoutAnalysis', {
          message: 'Quick response',
        });
        const toolResult = { message: 'Quick response' };

        const result = convertToolCallToMessage(toolCall, toolResult, 'completed');

        expect(result).not.toBeNull();
        expect(result?.type).toBe('response');
        expect(result?.message).toMatchObject({
          id: 'test-id-3',
          type: 'text',
          message: 'Quick response',
          is_final_message: true,
        } as BusterChatResponseMessage_text);
      });
    });

    describe('Sequential Thinking tool', () => {
      it('should convert sequentialThinking to reasoning text message', () => {
        const toolCall = createToolCall('test-id-4', 'sequentialThinking', {
          thought: 'I need to analyze the data first',
          thoughtNumber: 1,
          totalThoughts: 3,
          nextThoughtNeeded: true,
        });
        const toolResult = {
          thought: 'I need to analyze the data first',
          thoughtNumber: 1,
          totalThoughts: 3,
          nextThoughtNeeded: true,
        };

        const result = convertToolCallToMessage(toolCall, toolResult, 'completed');

        expect(result).not.toBeNull();
        expect(result?.type).toBe('reasoning');
        const reasoning = result?.message as BusterChatMessageReasoning_text;
        expect(reasoning).toMatchObject({
          id: 'test-id-4',
          type: 'text',
          title: 'Thought 1 of 3',
          message: 'I need to analyze the data first',
          status: 'completed',
          finished_reasoning: false,
        });
      });

      it('should mark finished_reasoning as true when nextThoughtNeeded is false', () => {
        const toolCall = createToolCall('test-id-5', 'sequential-thinking', {
          thought: 'Final thought',
          thoughtNumber: 3,
          totalThoughts: 3,
          nextThoughtNeeded: false,
        });
        const toolResult = {
          thought: 'Final thought',
          thoughtNumber: 3,
          totalThoughts: 3,
          nextThoughtNeeded: false,
        };

        const result = convertToolCallToMessage(toolCall, toolResult, 'completed');

        expect(result).not.toBeNull();
        const reasoning = result?.message as BusterChatMessageReasoning_text;
        expect(reasoning.finished_reasoning).toBe(true);
      });
    });

    describe('Create Metrics File tool', () => {
      it('should convert createMetricsFile to reasoning files message', () => {
        const toolCall = createToolCall('test-id-6', 'createMetricsFile', {});
        const toolResult = {
          files: [
            {
              id: 'metric-1',
              name: 'revenue_metrics.yml',
              version_number: 1,
              yml_content: 'metric: revenue',
            },
            {
              id: 'metric-2',
              name: 'user_metrics.yml',
              version_number: 1,
              yml_content: 'metric: users',
            },
          ],
          failed_files: [
            {
              name: 'failed_metric.yml',
              error: 'Invalid syntax',
            },
          ],
        };

        const result = convertToolCallToMessage(toolCall, toolResult, 'completed');

        expect(result).not.toBeNull();
        expect(result?.type).toBe('reasoning');
        const reasoning = result?.message as BusterChatMessageReasoning_files;
        expect(reasoning).toMatchObject({
          id: 'test-id-6',
          type: 'files',
          title: 'Created 2 metrics',
          status: 'completed',
          secondary_title: '1 failed',
        });
        expect(reasoning.file_ids).toHaveLength(3);
        expect(reasoning.files['metric-1']).toMatchObject({
          id: 'metric-1',
          file_type: 'metric',
          file_name: 'revenue_metrics.yml',
          version_number: 1,
          status: 'completed',
        });
      });

      it('should handle all successful files', () => {
        const toolCall = createToolCall('test-id-7', 'create-metrics-file', {});
        const toolResult = {
          files: [
            {
              id: 'metric-1',
              name: 'metric.yml',
              version_number: 1,
              yml_content: 'content',
            },
          ],
          failed_files: [],
        };

        const result = convertToolCallToMessage(toolCall, toolResult, 'completed');

        const reasoning = result?.message as BusterChatMessageReasoning_files;
        expect(reasoning.title).toBe('Created 1 metric');
        expect(reasoning.secondary_title).toBeUndefined();
      });
    });

    describe('Create Dashboards File tool', () => {
      it('should convert createDashboardsFile to reasoning files message', () => {
        const toolCall = createToolCall('test-id-8', 'createDashboardsFile', {});
        const toolResult = {
          files: [
            {
              id: 'dashboard-1',
              name: 'sales_dashboard.yml',
              version_number: 1,
              yml_content: 'dashboard: sales',
            },
          ],
          failed_files: [],
        };

        const result = convertToolCallToMessage(toolCall, toolResult, 'completed');

        expect(result).not.toBeNull();
        expect(result?.type).toBe('reasoning');
        const reasoning = result?.message as BusterChatMessageReasoning_files;
        expect(reasoning.files['dashboard-1'].file_type).toBe('dashboard');
      });
    });

    describe('Modify Files tools', () => {
      it('should convert modifyMetricsFile to reasoning files message', () => {
        const toolCall = createToolCall('test-id-9', 'modifyMetricsFile', {});
        const toolResult = {
          files: [
            {
              id: 'metric-1',
              name: 'updated_metric.yml',
              version_number: 2,
              yml_content: 'updated content',
            },
          ],
          failed_files: [],
        };

        const result = convertToolCallToMessage(toolCall, toolResult, 'completed');

        const reasoning = result?.message as BusterChatMessageReasoning_files;
        expect(reasoning.title).toBe('Modified 1 metric');
        expect(reasoning.files['metric-1'].version_number).toBe(2);
      });

      it('should convert modifyDashboardsFile to reasoning files message', () => {
        const toolCall = createToolCall('test-id-10', 'modifyDashboardsFile', {});
        const toolResult = {
          files: [],
          failed_files: [
            {
              file_name: 'dashboard.yml',
              error: 'File not found',
            },
          ],
        };

        const result = convertToolCallToMessage(toolCall, toolResult, 'completed');

        const reasoning = result?.message as BusterChatMessageReasoning_files;
        expect(reasoning.title).toBe('Modified 0 dashboards');
        expect(reasoning.secondary_title).toBe('1 failed');
        expect(reasoning.status).toBe('completed');
      });
    });

    describe('Execute SQL tool', () => {
      it('should convert executeSql to reasoning text message', () => {
        const toolCall = createToolCall('test-id-11', 'executeSql', {});
        const toolResult = {
          data: [{ id: 1, name: 'test' }],
          query: 'SELECT * FROM users',
          rowCount: 1,
        };

        const result = convertToolCallToMessage(toolCall, toolResult, 'completed');

        expect(result).not.toBeNull();
        expect(result?.type).toBe('reasoning');
        const reasoning = result?.message as BusterChatMessageReasoning_text;
        expect(reasoning).toMatchObject({
          type: 'text',
          title: 'Executed SQL Query',
          secondary_title: '1 rows returned',
          message: 'Query: SELECT * FROM users\n\nReturned 1 rows',
        });
      });
    });

    describe('Unknown tools', () => {
      it('should return null for unknown tool', () => {
        const toolCall = createToolCall('test-id-12', 'unknownTool', {});
        const toolResult = {};

        const result = convertToolCallToMessage(toolCall, toolResult, 'completed');

        expect(result).toBeNull();
      });
    });
  });

  describe('extractMessagesFromToolCalls', () => {
    it('should extract multiple messages from tool calls', () => {
      const toolCalls: ToolCall[] = [
        createToolCall('id-1', 'sequentialThinking', {}),
        createToolCall('id-2', 'doneTool', {}),
        createToolCall('id-3', 'createMetricsFile', {}),
      ];

      const toolResults = new Map([
        [
          'id-1',
          { thought: 'Thinking...', thoughtNumber: 1, totalThoughts: 1, nextThoughtNeeded: false },
        ],
        ['id-2', { message: 'All done!' }],
        ['id-3', { files: [], failed_files: [] }],
      ]);

      const { reasoningMessages, responseMessages } = extractMessagesFromToolCalls(
        toolCalls,
        toolResults
      );

      expect(reasoningMessages).toHaveLength(2); // sequential thinking + create metrics
      expect(responseMessages).toHaveLength(1); // done tool
      expect(responseMessages[0]).toMatchObject({
        type: 'text',
        message: 'All done!',
        is_final_message: true,
      });
    });

    it('should handle tool calls without results', () => {
      const toolCalls: ToolCall[] = [createToolCall('id-1', 'sequentialThinking', {})];

      const { reasoningMessages, responseMessages } = extractMessagesFromToolCalls(toolCalls);

      expect(reasoningMessages).toHaveLength(0);
      expect(responseMessages).toHaveLength(0);
    });

    it('should handle mixed valid and invalid results', () => {
      const toolCalls: ToolCall[] = [
        createToolCall('id-1', 'doneTool', {}),
        createToolCall('id-2', 'doneTool', {}),
      ];

      const toolResults = new Map([
        ['id-1', { message: 'Valid message' }],
        ['id-2', { invalid: 'structure' }], // Invalid result structure
      ]);

      const { reasoningMessages, responseMessages } = extractMessagesFromToolCalls(
        toolCalls,
        toolResults
      );

      expect(responseMessages).toHaveLength(1); // Only valid result
      expect(responseMessages[0]).toMatchObject({
        message: 'Valid message',
      });
    });
  });

  describe('Complex sequences', () => {
    it('should handle a typical analyst workflow sequence', () => {
      const toolCalls: ToolCall[] = [
        createToolCall('think-1', 'sequentialThinking', {}),
        createToolCall('think-2', 'sequentialThinking', {}),
        createToolCall('metric-1', 'createMetricsFile', {}),
        createToolCall('dashboard-1', 'createDashboardsFile', {}),
        createToolCall('done-1', 'doneTool', {}),
      ];

      const toolResults = new Map([
        [
          'think-1',
          { thought: 'First thought', thoughtNumber: 1, totalThoughts: 2, nextThoughtNeeded: true },
        ],
        [
          'think-2',
          {
            thought: 'Second thought',
            thoughtNumber: 2,
            totalThoughts: 2,
            nextThoughtNeeded: false,
          },
        ],
        [
          'metric-1',
          {
            files: [{ id: 'm1', name: 'metric.yml', version_number: 1, yml_content: 'metric' }],
            failed_files: [],
          },
        ],
        [
          'dashboard-1',
          {
            files: [
              { id: 'd1', name: 'dashboard.yml', version_number: 1, yml_content: 'dashboard' },
            ],
            failed_files: [],
          },
        ],
        ['done-1', { message: 'Analysis complete with 1 metric and 1 dashboard created.' }],
      ]);

      const { reasoningMessages, responseMessages } = extractMessagesFromToolCalls(
        toolCalls,
        toolResults
      );

      // Should have 4 reasoning messages (2 thoughts + 1 metric + 1 dashboard)
      expect(reasoningMessages).toHaveLength(4);

      // Should have 1 response message (done tool)
      expect(responseMessages).toHaveLength(1);

      // Check specific messages
      expect(reasoningMessages[0]).toMatchObject({
        type: 'text',
        title: 'Thought 1 of 2',
      });
      expect(reasoningMessages[1]).toMatchObject({
        type: 'text',
        title: 'Thought 2 of 2',
        finished_reasoning: true,
      });
      expect(reasoningMessages[2]).toMatchObject({
        type: 'files',
        title: 'Created 1 metric',
      });
      expect(reasoningMessages[3]).toMatchObject({
        type: 'files',
        title: 'Created 1 dashboard',
      });
      expect(responseMessages[0]).toMatchObject({
        type: 'text',
        message: 'Analysis complete with 1 metric and 1 dashboard created.',
        is_final_message: true,
      });
    });
  });
});
