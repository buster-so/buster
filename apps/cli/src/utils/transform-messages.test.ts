import type { ModelMessage } from '@buster/ai';
import { describe, expect, it } from 'vitest';
import { transformModelMessagesToUI } from './transform-messages';

describe('transformModelMessagesToUI - AI SDK v5 Content Arrays', () => {
  describe('User messages', () => {
    it('should transform user message with string content', () => {
      const messages: ModelMessage[] = [{ role: 'user', content: 'Hello' }];

      const result = transformModelMessagesToUI(messages);

      expect(result).toHaveLength(1);
      expect(result[0]!.message).toEqual({
        kind: 'user',
        content: 'Hello',
      });
    });

    it('should transform user message with content array', () => {
      const messages: ModelMessage[] = [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Hello' }],
        },
      ];

      const result = transformModelMessagesToUI(messages);

      expect(result).toHaveLength(1);
      expect(result[0]!.message).toEqual({
        kind: 'user',
        content: 'Hello',
      });
    });
  });

  describe('Assistant text messages', () => {
    it('should transform single text content into text-delta message', () => {
      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [{ type: 'text', text: 'Response text' }],
        },
      ];

      const result = transformModelMessagesToUI(messages);

      expect(result).toHaveLength(1);
      expect(result[0]!.message).toEqual({
        kind: 'text-delta',
        content: 'Response text',
      });
    });

    it('should concatenate multiple text contents', () => {
      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'First part. ' },
            { type: 'text', text: 'Second part.' },
          ],
        },
      ];

      const result = transformModelMessagesToUI(messages);

      expect(result[0]!.message).toEqual({
        kind: 'text-delta',
        content: 'First part. Second part.',
      });
    });

    it('should ignore reasoning content (internal to model)', () => {
      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            { type: 'reasoning', text: 'Internal thinking...' },
            { type: 'text', text: 'User-facing response' },
          ],
        },
      ];

      const result = transformModelMessagesToUI(messages);

      // Should only show user-facing text, not reasoning
      expect(result).toHaveLength(1);
      expect(result[0]!.message.kind).toBe('text-delta');
      if (result[0]!.message.kind === 'text-delta') {
        expect(result[0]!.message.content).toBe('User-facing response');
      }
    });
  });

  describe('Tool call messages', () => {
    it('should transform bash tool call correctly', () => {
      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'call_123',
              toolName: 'bash',
              input: { command: 'ls -la', description: 'List files' },
            },
          ],
        },
      ];

      const result = transformModelMessagesToUI(messages);

      expect(result).toHaveLength(1);
      expect(result[0]!.message).toEqual({
        kind: 'bash',
        event: 'start',
        args: { command: 'ls -la', description: 'List files' },
      });
    });

    it('should transform read tool call correctly', () => {
      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'call_456',
              toolName: 'read',
              input: { file_path: '/path/to/file.ts' },
            },
          ],
        },
      ];

      const result = transformModelMessagesToUI(messages);

      expect(result[0]!.message).toEqual({
        kind: 'read',
        event: 'start',
        args: { file_path: '/path/to/file.ts' },
      });
    });

    it('should transform task tool call correctly', () => {
      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'call_789',
              toolName: 'task',
              input: {
                instructions: 'Search for user authentication code',
                description: 'Find auth logic',
              },
            },
          ],
        },
      ];

      const result = transformModelMessagesToUI(messages);

      expect(result[0]!.message).toEqual({
        kind: 'task',
        event: 'start',
        args: {
          instructions: 'Search for user authentication code',
          description: 'Find auth logic',
        },
      });
    });

    it('should handle multiple tool calls in same message', () => {
      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'call_1',
              toolName: 'bash',
              input: { command: 'pwd' },
            },
            {
              type: 'tool-call',
              toolCallId: 'call_2',
              toolName: 'ls',
              input: { path: '.' },
            },
          ],
        },
      ];

      const result = transformModelMessagesToUI(messages);

      expect(result).toHaveLength(2);
      expect(result[0]!.message.kind).toBe('bash');
      expect(result[1]!.message.kind).toBe('ls');
    });
  });

  describe('Tool result messages', () => {
    it('should match tool result with corresponding tool call', () => {
      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'call_abc',
              toolName: 'bash',
              input: { command: 'echo hello' },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call_abc',
              toolName: 'bash',
              output: { type: 'json', value: '{"stdout":"hello\\n"}' },
            },
          ],
        },
      ];

      const result = transformModelMessagesToUI(messages);

      expect(result).toHaveLength(1);
      expect(result[0]!.message).toEqual({
        kind: 'bash',
        event: 'complete',
        args: { command: 'echo hello' },
        result: { stdout: 'hello\n' },
      });
    });

    it('should handle task tool with nested messages', () => {
      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'task_123',
              toolName: 'task',
              input: { instructions: 'Find auth code' },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'task_123',
              toolName: 'task',
              output: {
                type: 'json',
                value: JSON.stringify({
                  status: 'success',
                  summary: 'Found authentication logic',
                  messages: [{ kind: 'grep', event: 'complete', args: {}, result: {} }],
                }),
              },
            },
          ],
        },
      ];

      const result = transformModelMessagesToUI(messages);

      expect(result[0]!.message.kind).toBe('task');
      if (result[0]!.message.kind === 'task' && result[0]!.message.event === 'complete') {
        expect(result[0]!.message.result?.status).toBe('success');
        expect(result[0]!.message.result?.messages).toHaveLength(1);
      }
    });

    it('should handle multiple tool results in sequence', () => {
      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'call_1',
              toolName: 'read',
              input: { file_path: 'file1.ts' },
            },
            {
              type: 'tool-call',
              toolCallId: 'call_2',
              toolName: 'read',
              input: { file_path: 'file2.ts' },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call_1',
              toolName: 'read',
              output: {
                type: 'json',
                value: JSON.stringify({ content: 'File 1 content' }),
              },
            },
            {
              type: 'tool-result',
              toolCallId: 'call_2',
              toolName: 'read',
              output: {
                type: 'json',
                value: JSON.stringify({ content: 'File 2 content' }),
              },
            },
          ],
        },
      ];

      const result = transformModelMessagesToUI(messages);

      expect(result).toHaveLength(2);
      if (result[0]!.message.kind === 'read' && result[0]!.message.event === 'complete') {
        expect(result[0]!.message.result?.content).toBe('File 1 content');
      }
      if (result[1]!.message.kind === 'read' && result[1]!.message.event === 'complete') {
        expect(result[1]!.message.result?.content).toBe('File 2 content');
      }
    });
  });

  describe('Mixed content messages', () => {
    it('should handle text content after tool call in same assistant message', () => {
      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'call_1',
              toolName: 'bash',
              input: { command: 'ls' },
            },
            { type: 'text', text: 'Running command...' },
          ],
        },
      ];

      const result = transformModelMessagesToUI(messages);

      expect(result).toHaveLength(2);
      expect(result[0]?.message.kind).toBe('bash');
      expect(result[1]?.message.kind).toBe('text-delta');
      expect(result[1]?.message).toHaveProperty('content', 'Running command...');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty messages array', () => {
      const result = transformModelMessagesToUI([]);
      expect(result).toEqual([]);
    });

    it('should handle message with empty content array', () => {
      const messages: ModelMessage[] = [{ role: 'assistant', content: [] }];

      const result = transformModelMessagesToUI(messages);
      expect(result).toEqual([]);
    });

    it('should skip unknown tool names gracefully', () => {
      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: 'call_123',
              toolName: 'unknown_tool',
              input: {},
            },
          ],
        },
      ];

      // Should not throw, just skip unknown tools
      const result = transformModelMessagesToUI(messages);
      expect(result).toEqual([]);
    });

    it('should assign sequential IDs to messages', () => {
      const messages: ModelMessage[] = [
        { role: 'user', content: 'First' },
        { role: 'assistant', content: [{ type: 'text', text: 'Second' }] },
        { role: 'user', content: 'Third' },
      ];

      const result = transformModelMessagesToUI(messages);

      expect(result[0]?.id).toBeDefined();
      expect(result[1]?.id).toBeDefined();
      expect(result[2]?.id).toBeDefined();
      expect(result[0]!.id).toBeLessThan(result[1]!.id);
      expect(result[1]!.id).toBeLessThan(result[2]!.id);
    });

    it('should handle tool result without matching tool call', () => {
      const messages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'orphan_call',
              toolName: 'bash',
              output: { type: 'json', value: '{}' },
            },
          ],
        },
      ];

      // Should not throw, just skip orphaned results
      const result = transformModelMessagesToUI(messages);
      expect(result).toEqual([]);
    });
  });
});
