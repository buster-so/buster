import { describe, expect, it } from 'vitest';
import { detectPaste, insertTextAtCursor } from './paste-handler';

describe('paste-handler', () => {
  describe('detectPaste', () => {
    describe('should detect paste operations', () => {
      it('should return true for multi-character input with no special keys', () => {
        const result = detectPaste({
          input: 'hello world',
          hasSpecialKeys: false,
        });
        expect(result).toBe(true);
      });

      it('should return true for 100+ line paste', () => {
        const longText = Array(100).fill('line of text\n').join('');
        const result = detectPaste({
          input: longText,
          hasSpecialKeys: false,
        });
        expect(result).toBe(true);
      });

      it('should return true for multi-line paste with newlines', () => {
        const result = detectPaste({
          input: 'line 1\nline 2\nline 3',
          hasSpecialKeys: false,
        });
        expect(result).toBe(true);
      });

      it('should return true for two-character paste', () => {
        const result = detectPaste({
          input: 'ab',
          hasSpecialKeys: false,
        });
        expect(result).toBe(true);
      });
    });

    describe('should NOT detect as paste (typed input)', () => {
      it('should return false for single character with no special keys', () => {
        const result = detectPaste({
          input: 'a',
          hasSpecialKeys: false,
        });
        expect(result).toBe(false);
      });

      it('should return false for single character with special keys', () => {
        const result = detectPaste({
          input: 'c',
          hasSpecialKeys: true,
        });
        expect(result).toBe(false);
      });

      it('should return false for multi-char input with special keys pressed', () => {
        const result = detectPaste({
          input: 'hello',
          hasSpecialKeys: true,
        });
        expect(result).toBe(false);
      });

      it('should return false for empty string', () => {
        const result = detectPaste({
          input: '',
          hasSpecialKeys: false,
        });
        expect(result).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle special characters in paste', () => {
        const result = detectPaste({
          input: '!@#$%^&*()',
          hasSpecialKeys: false,
        });
        expect(result).toBe(true);
      });

      it('should handle unicode characters', () => {
        const result = detectPaste({
          input: '你好世界',
          hasSpecialKeys: false,
        });
        expect(result).toBe(true);
      });

      it('should handle mixed content with special chars', () => {
        const result = detectPaste({
          input: 'SELECT * FROM users;\nWHERE id = 1;',
          hasSpecialKeys: false,
        });
        expect(result).toBe(true);
      });
    });
  });

  describe('insertTextAtCursor', () => {
    describe('basic insertion', () => {
      it('should insert text at start of empty string', () => {
        const result = insertTextAtCursor({
          currentValue: '',
          cursorPosition: 0,
          textToInsert: 'hello',
        });
        expect(result.newValue).toBe('hello');
        expect(result.newCursorPosition).toBe(5);
      });

      it('should insert text at start of existing string', () => {
        const result = insertTextAtCursor({
          currentValue: 'world',
          cursorPosition: 0,
          textToInsert: 'hello ',
        });
        expect(result.newValue).toBe('hello world');
        expect(result.newCursorPosition).toBe(6);
      });

      it('should insert text at end of string', () => {
        const result = insertTextAtCursor({
          currentValue: 'hello',
          cursorPosition: 5,
          textToInsert: ' world',
        });
        expect(result.newValue).toBe('hello world');
        expect(result.newCursorPosition).toBe(11);
      });

      it('should insert text in middle of string', () => {
        const result = insertTextAtCursor({
          currentValue: 'helloworld',
          cursorPosition: 5,
          textToInsert: ' ',
        });
        expect(result.newValue).toBe('hello world');
        expect(result.newCursorPosition).toBe(6);
      });
    });

    describe('multi-line insertion', () => {
      it('should insert multi-line text', () => {
        const result = insertTextAtCursor({
          currentValue: '',
          cursorPosition: 0,
          textToInsert: 'line 1\nline 2\nline 3',
        });
        expect(result.newValue).toBe('line 1\nline 2\nline 3');
        expect(result.newCursorPosition).toBe(20);
      });

      it('should insert multi-line text in middle of existing content', () => {
        const result = insertTextAtCursor({
          currentValue: 'start\nend',
          cursorPosition: 6,
          textToInsert: 'middle\n',
        });
        expect(result.newValue).toBe('start\nmiddle\nend');
        expect(result.newCursorPosition).toBe(13);
      });

      it('should handle 100+ line paste', () => {
        const longText = Array(100).fill('line\n').join('');
        const result = insertTextAtCursor({
          currentValue: '',
          cursorPosition: 0,
          textToInsert: longText,
        });
        expect(result.newValue).toBe(longText);
        expect(result.newCursorPosition).toBe(longText.length);
      });
    });

    describe('cursor position handling', () => {
      it('should handle cursor at position 0', () => {
        const result = insertTextAtCursor({
          currentValue: 'test',
          cursorPosition: 0,
          textToInsert: 'X',
        });
        expect(result.newValue).toBe('Xtest');
        expect(result.newCursorPosition).toBe(1);
      });

      it('should handle cursor at last position', () => {
        const result = insertTextAtCursor({
          currentValue: 'test',
          cursorPosition: 4,
          textToInsert: 'X',
        });
        expect(result.newValue).toBe('testX');
        expect(result.newCursorPosition).toBe(5);
      });

      it('should move cursor by length of inserted text', () => {
        const result = insertTextAtCursor({
          currentValue: 'hello world',
          cursorPosition: 6,
          textToInsert: 'beautiful ',
        });
        expect(result.newValue).toBe('hello beautiful world');
        expect(result.newCursorPosition).toBe(16);
      });
    });

    describe('edge cases', () => {
      it('should handle empty insert', () => {
        const result = insertTextAtCursor({
          currentValue: 'hello',
          cursorPosition: 2,
          textToInsert: '',
        });
        expect(result.newValue).toBe('hello');
        expect(result.newCursorPosition).toBe(2);
      });

      it('should handle special characters', () => {
        const result = insertTextAtCursor({
          currentValue: 'test',
          cursorPosition: 4,
          textToInsert: '\t\n!@#$',
        });
        expect(result.newValue).toBe('test\t\n!@#$');
        expect(result.newCursorPosition).toBe(10);
      });

      it('should handle unicode characters', () => {
        const result = insertTextAtCursor({
          currentValue: 'hello',
          cursorPosition: 5,
          textToInsert: ' 世界',
        });
        expect(result.newValue).toBe('hello 世界');
        expect(result.newCursorPosition).toBe(8);
      });

      it('should handle cursor position beyond string length (defaults to end)', () => {
        const result = insertTextAtCursor({
          currentValue: 'test',
          cursorPosition: 999,
          textToInsert: 'X',
        });
        expect(result.newValue).toBe('testX');
        expect(result.newCursorPosition).toBe(5);
      });

      it('should handle negative cursor position (defaults to start)', () => {
        const result = insertTextAtCursor({
          currentValue: 'test',
          cursorPosition: -1,
          textToInsert: 'X',
        });
        expect(result.newValue).toBe('Xtest');
        expect(result.newCursorPosition).toBe(1);
      });
    });

    describe('SQL paste scenarios', () => {
      it('should handle SQL query paste', () => {
        const sqlQuery = `SELECT u.id, u.name, o.order_id
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
ORDER BY u.name;`;

        const result = insertTextAtCursor({
          currentValue: '',
          cursorPosition: 0,
          textToInsert: sqlQuery,
        });

        expect(result.newValue).toBe(sqlQuery);
        expect(result.newCursorPosition).toBe(sqlQuery.length);
      });
    });

    describe('performance', () => {
      it('should handle very large paste efficiently', () => {
        const largeText = 'x'.repeat(10000);
        const start = performance.now();

        const result = insertTextAtCursor({
          currentValue: 'prefix',
          cursorPosition: 6,
          textToInsert: largeText,
        });

        const duration = performance.now() - start;

        expect(result.newValue).toBe('prefix' + largeText);
        expect(result.newCursorPosition).toBe(6 + largeText.length);
        expect(duration).toBeLessThan(100); // Should complete in less than 100ms
      });
    });
  });
});
