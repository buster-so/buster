import { describe, expect, test } from 'vitest';
import {
  createTodoToolCallMessage,
  createTodoToolResultMessage,
} from '../../../src/utils/memory/todos-to-messages';

describe('Todos to Message Conversion', () => {
  const sampleTodos = `[ ] Determine how "sales" is identified
[ ] Determine the time frame for analysis
[ ] Determine the visualization type and axes`;

  describe('createTodoToolCallMessage', () => {
    test('should create proper assistant tool call message', () => {
      const message = createTodoToolCallMessage(sampleTodos);

      expect(message.role).toBe('assistant');
      expect(Array.isArray(message.content)).toBe(true);

      if (Array.isArray(message.content)) {
        expect(message.content).toHaveLength(1);

        const toolCall = message.content[0];
        expect(toolCall).toMatchObject({
          type: 'tool-call',
          toolCallId: 'create-todos-call',
          toolName: 'createToDos',
          args: { todos: sampleTodos },
        });
      }
    });

    test('should handle empty todos', () => {
      const message = createTodoToolCallMessage('');

      expect(message.role).toBe('assistant');
      if (Array.isArray(message.content)) {
        const toolCall = message.content[0];
        expect(toolCall).toMatchObject({
          args: { todos: '' },
        });
      }
    });
  });

  describe('createTodoToolResultMessage', () => {
    test('should create proper tool result message', () => {
      const message = createTodoToolResultMessage(sampleTodos);

      expect(message.role).toBe('tool');
      expect(Array.isArray(message.content)).toBe(true);

      if (Array.isArray(message.content)) {
        expect(message.content).toHaveLength(1);

        const toolResult = message.content[0];
        expect(toolResult).toMatchObject({
          type: 'tool-result',
          toolCallId: 'create-todos-call',
          toolName: 'createToDos',
          result: {
            success: true,
          },
        });
      }
    });

    test('should handle empty todos in result', () => {
      const message = createTodoToolResultMessage('');

      expect(message.role).toBe('tool');
      expect(Array.isArray(message.content)).toBe(true);

      if (Array.isArray(message.content)) {
        const toolResult = message.content[0];
        expect(toolResult).toMatchObject({
          type: 'tool-result',
          toolCallId: 'create-todos-call',
          toolName: 'createToDos',
          result: {
            success: true,
          },
        });
      }
    });
  });

  describe('message pair integration', () => {
    test('should create compatible tool call and result messages', () => {
      const callMessage = createTodoToolCallMessage(sampleTodos);
      const resultMessage = createTodoToolResultMessage(sampleTodos);

      // Verify the toolCallId matches between call and result
      if (Array.isArray(callMessage.content) && Array.isArray(resultMessage.content)) {
        const toolCall = callMessage.content[0];
        const toolResult = resultMessage.content[0];
        expect(toolCall.toolCallId).toBe(toolResult.toolCallId);
        expect(toolCall.toolName).toBe(toolResult.toolName);
      }
    });
  });
});
