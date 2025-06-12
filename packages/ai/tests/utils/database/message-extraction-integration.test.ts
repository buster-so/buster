import type { CoreMessage } from 'ai';
import { describe, expect, test } from 'vitest';
import {
  extractResponseMessages,
  formatLlmMessagesAsReasoning,
} from '../../../src/utils/database/formatLlmMessagesAsReasoning';

describe('message extraction integration', () => {
  test('extracts reasoning messages from sequential thinking', () => {
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call-123',
            toolName: 'sequentialThinking',
            args: {
              thought: 'I need to analyze the customer data',
              thoughtNumber: 1,
              totalThoughts: 3,
              nextThoughtNeeded: true,
            },
          },
        ],
      },
    ];

    const reasoning = formatLlmMessagesAsReasoning(messages);

    expect(reasoning).toHaveLength(1);
    expect(reasoning[0]).toMatchObject({
      id: 'call-123',
      type: 'text',
      title: 'Thought 1 of 3',
      message: 'I need to analyze the customer data',
      secondary_title: 'TODO',
      status: 'completed',
      finished_reasoning: false,
    });
  });

  test('extracts response messages from doneTool', () => {
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call-456',
            toolName: 'doneTool',
            args: {
              message: 'Here are the top 5 customers by revenue',
            },
          },
        ],
      },
    ];

    const responses = extractResponseMessages(messages);

    expect(responses).toHaveLength(1);
    expect(responses[0]).toMatchObject({
      id: 'call-456',
      type: 'text',
      message: 'Here are the top 5 customers by revenue',
      is_final_message: true,
    });
  });

  test('separates reasoning and response messages correctly', () => {
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call-1',
            toolName: 'sequentialThinking',
            args: {
              thought: 'Analyzing the request',
              thoughtNumber: 1,
              totalThoughts: 2,
              nextThoughtNeeded: true,
            },
          },
        ],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call-2',
            toolName: 'executeSql',
            args: {
              sql: 'SELECT * FROM customers ORDER BY revenue DESC LIMIT 5',
            },
          },
        ],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call-3',
            toolName: 'doneTool',
            args: {
              message: 'Analysis complete',
            },
          },
        ],
      },
    ];

    const reasoning = formatLlmMessagesAsReasoning(messages);
    const responses = extractResponseMessages(messages);

    // Should have 2 reasoning messages (sequentialThinking and executeSql)
    expect(reasoning).toHaveLength(2);
    expect(reasoning[0].title).toBe('Thought 1 of 2');
    expect(reasoning[1].title).toBe('Executing SQL');

    // Should have 1 response message (doneTool)
    expect(responses).toHaveLength(1);
    expect(responses[0].message).toBe('Analysis complete');
  });

  test('handles create metrics file correctly', () => {
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call-metrics',
            toolName: 'createMetrics',
            args: {
              files: [
                {
                  name: 'revenue_by_customer.yml',
                  yml_content: 'metrics:\n  - name: revenue\n    type: sum',
                },
              ],
            },
          },
        ],
      },
    ];

    const reasoning = formatLlmMessagesAsReasoning(messages);

    expect(reasoning).toHaveLength(1);
    expect(reasoning[0]).toMatchObject({
      type: 'files',
      title: 'Creating 1 metric',
      secondary_title: 'TODO',
      file_ids: expect.any(Array),
      files: expect.any(Object),
    });

    const fileId = reasoning[0].file_ids[0];
    expect(reasoning[0].files[fileId]).toMatchObject({
      file_type: 'metric',
      file_name: 'revenue_by_customer.yml',
      file: {
        text: 'metrics:\n  - name: revenue\n    type: sum',
      },
    });
  });
});
