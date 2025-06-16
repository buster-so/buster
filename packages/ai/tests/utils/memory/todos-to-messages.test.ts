import { describe, expect, test } from 'vitest';
import {
  createTodoReasoningMessage,
  createTodoToolCallMessage,
} from '../../../src/utils/memory/todos-to-messages';

describe('Todos to Message Conversion', () => {
  const sampleTodos = `[ ] Determine how "sales" is identified
[ ] Determine the time frame for analysis
[ ] Determine the visualization type and axes`;

  describe('createTodoToolCallMessage', () => {
    test('should create proper user message with todo list', () => {
      const message = createTodoToolCallMessage(sampleTodos);

      expect(message.role).toBe('user');
      expect(Array.isArray(message.content)).toBe(true);

      if (Array.isArray(message.content)) {
        expect(message.content).toHaveLength(1);

        const textContent = message.content[0];
        expect(textContent).toMatchObject({
          type: 'text',
        });
        expect(textContent.text).toContain('<todo_list>');
        expect(textContent.text).toContain(sampleTodos);
      }
    });

    test('should handle empty todos', () => {
      const message = createTodoToolCallMessage('');

      expect(message.role).toBe('user');
      if (Array.isArray(message.content)) {
        const textContent = message.content[0];
        expect(textContent.text).toContain('<todo_list>');
      }
    });
  });

  describe('createTodoReasoningMessage', () => {
    test('should create proper reasoning files message', () => {
      const reasoningMessage = createTodoReasoningMessage(sampleTodos);

      expect(reasoningMessage.type).toBe('files');
      expect(reasoningMessage.title).toBe('TODO List');
      expect(reasoningMessage.status).toBe('completed');
      expect(reasoningMessage.file_ids).toHaveLength(1);

      const fileId = reasoningMessage.file_ids[0];
      expect(reasoningMessage.files[fileId]).toBeDefined();

      const file = reasoningMessage.files[fileId];
      expect(file.file_type).toBe('todo');
      expect(file.file_name).toBe('todos.md');
      expect(file.version_number).toBe(1);
      expect(file.status).toBe('completed');
      expect(file.file.text).toBe(sampleTodos);
    });

    test('should handle empty todos in reasoning message', () => {
      const reasoningMessage = createTodoReasoningMessage('');

      expect(reasoningMessage.type).toBe('files');
      expect(reasoningMessage.title).toBe('TODO List');
      expect(reasoningMessage.file_ids).toHaveLength(1);

      const fileId = reasoningMessage.file_ids[0];
      const file = reasoningMessage.files[fileId];
      expect(file.file.text).toBe('');
    });

    test('should generate unique file IDs for different calls', () => {
      const message1 = createTodoReasoningMessage(sampleTodos);
      const message2 = createTodoReasoningMessage(sampleTodos);

      expect(message1.id).not.toBe(message2.id);
      expect(message1.file_ids[0]).not.toBe(message2.file_ids[0]);
    });
  });

  describe('dual message creation', () => {
    test('should create both conversation and reasoning messages for same todos', () => {
      const conversationMessage = createTodoToolCallMessage(sampleTodos);
      const reasoningMessage = createTodoReasoningMessage(sampleTodos);

      // Verify conversation message structure
      expect(conversationMessage.role).toBe('user');
      expect(conversationMessage.content[0].text).toContain(sampleTodos);

      // Verify reasoning message structure
      expect(reasoningMessage.type).toBe('files');
      const fileId = reasoningMessage.file_ids[0];
      expect(reasoningMessage.files[fileId].file.text).toBe(sampleTodos);

      // Both should contain the same todo content
      expect(reasoningMessage.files[fileId].file.text).toBe(sampleTodos);
    });
  });
});
