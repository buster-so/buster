import { describe, expect, it } from 'vitest';
import {
  countLines,
  createPasteToken,
  reconstructActualText,
  shouldCollapsePaste,
} from './paste-token';

describe('paste-token', () => {
  describe('countLines', () => {
    it('should count single line as 1', () => {
      expect(countLines('hello world')).toBe(1);
    });

    it('should count multiple lines correctly', () => {
      expect(countLines('line1\nline2\nline3')).toBe(3);
    });

    it('should count empty string as 1 line', () => {
      expect(countLines('')).toBe(1);
    });

    it('should handle text ending with newline', () => {
      expect(countLines('line1\nline2\n')).toBe(2);
    });

    it('should handle 100+ lines', () => {
      const text = Array(100).fill('line').join('\n');
      expect(countLines(text)).toBe(100);
    });

    it('should handle \\r line endings (Mac)', () => {
      expect(countLines('line1\rline2\rline3')).toBe(3);
    });

    it('should handle \\r\\n line endings (Windows)', () => {
      expect(countLines('line1\r\nline2\r\nline3')).toBe(3);
    });

    it('should handle mixed line endings', () => {
      expect(countLines('line1\nline2\rline3\r\nline4')).toBe(4);
    });
  });

  describe('shouldCollapsePaste', () => {
    it('should return false for 5 lines or less', () => {
      expect(shouldCollapsePaste('line1')).toBe(false);
      expect(shouldCollapsePaste('line1\nline2')).toBe(false);
      expect(shouldCollapsePaste('line1\nline2\nline3')).toBe(false);
      expect(shouldCollapsePaste('line1\nline2\nline3\nline4')).toBe(false);
      expect(shouldCollapsePaste('line1\nline2\nline3\nline4\nline5')).toBe(false);
    });

    it('should return true for more than 5 lines', () => {
      expect(shouldCollapsePaste('1\n2\n3\n4\n5\n6')).toBe(true);
      expect(shouldCollapsePaste('1\n2\n3\n4\n5\n6\n7')).toBe(true);
    });

    it('should return true for 100+ lines', () => {
      const text = Array(100).fill('line').join('\n');
      expect(shouldCollapsePaste(text)).toBe(true);
    });
  });

  describe('createPasteToken', () => {
    it('should create token with correct format for 10 lines', () => {
      const result = createPasteToken({
        text: 'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10',
        tokenNumber: 1,
      });

      expect(result.token).toBe('[Pasted text #1 +10 lines]');
      expect(result.actualText).toBe(
        'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10'
      );
      expect(result.lineCount).toBe(10);
    });

    it('should create token with incremented number', () => {
      const result = createPasteToken({
        text: 'a\nb\nc\nd\ne\nf',
        tokenNumber: 5,
      });

      expect(result.token).toBe('[Pasted text #5 +6 lines]');
      expect(result.tokenNumber).toBe(5);
    });

    it('should handle 100+ lines', () => {
      const text = Array(100).fill('line').join('\n');
      const result = createPasteToken({
        text,
        tokenNumber: 1,
      });

      expect(result.token).toBe('[Pasted text #1 +100 lines]');
      expect(result.lineCount).toBe(100);
    });

    it('should handle 500+ lines like in example', () => {
      const text = Array(506).fill('line').join('\n');
      const result = createPasteToken({
        text,
        tokenNumber: 1,
      });

      expect(result.token).toBe('[Pasted text #1 +506 lines]');
      expect(result.lineCount).toBe(506);
    });

    it('should preserve exact text in actualText', () => {
      const originalText = 'SELECT * FROM users;\nWHERE id = 1;\nORDER BY name;';
      const result = createPasteToken({
        text: originalText,
        tokenNumber: 2,
      });

      expect(result.actualText).toBe(originalText);
      expect(result.token).toBe('[Pasted text #2 +3 lines]');
    });
  });

  describe('reconstructActualText', () => {
    it('should return display text if no tokens', () => {
      const result = reconstructActualText({
        displayText: 'hello world',
        tokenMap: {},
      });

      expect(result).toBe('hello world');
    });

    it('should replace single token with actual text', () => {
      const result = reconstructActualText({
        displayText: '[Pasted text #1 +10 lines]',
        tokenMap: {
          '[Pasted text #1 +10 lines]':
            'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10',
        },
      });

      expect(result).toBe('line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10');
    });

    it('should replace multiple tokens', () => {
      const result = reconstructActualText({
        displayText: 'Start [Pasted text #1 +6 lines] middle [Pasted text #2 +3 lines] end',
        tokenMap: {
          '[Pasted text #1 +6 lines]': 'a\nb\nc\nd\ne\nf',
          '[Pasted text #2 +3 lines]': 'x\ny\nz',
        },
      });

      expect(result).toBe('Start a\nb\nc\nd\ne\nf middle x\ny\nz end');
    });

    it('should handle token at start of text', () => {
      const result = reconstructActualText({
        displayText: '[Pasted text #1 +3 lines] after',
        tokenMap: {
          '[Pasted text #1 +3 lines]': 'a\nb\nc',
        },
      });

      expect(result).toBe('a\nb\nc after');
    });

    it('should handle token at end of text', () => {
      const result = reconstructActualText({
        displayText: 'before [Pasted text #1 +3 lines]',
        tokenMap: {
          '[Pasted text #1 +3 lines]': 'a\nb\nc',
        },
      });

      expect(result).toBe('before a\nb\nc');
    });

    it('should handle mixed content with typed and pasted text', () => {
      const result = reconstructActualText({
        displayText: 'My query: [Pasted text #1 +5 lines]\nExplain this please',
        tokenMap: {
          '[Pasted text #1 +5 lines]':
            'SELECT *\nFROM users\nWHERE id = 1\nORDER BY name\nLIMIT 10',
        },
      });

      expect(result).toBe(
        'My query: SELECT *\nFROM users\nWHERE id = 1\nORDER BY name\nLIMIT 10\nExplain this please'
      );
    });

    it('should handle token being deleted (not in map)', () => {
      const result = reconstructActualText({
        displayText: 'hello world',
        tokenMap: {
          '[Pasted text #1 +5 lines]': 'should not appear',
        },
      });

      expect(result).toBe('hello world');
    });

    it('should handle partial token deletion', () => {
      // User deleted part of the token, so it's no longer a valid token
      const result = reconstructActualText({
        displayText: '[Pasted text #1 +10 li',
        tokenMap: {
          '[Pasted text #1 +10 lines]': 'should not appear',
        },
      });

      expect(result).toBe('[Pasted text #1 +10 li');
    });

    it('should handle 100+ line paste reconstruction', () => {
      const longText = Array(100).fill('line content').join('\n');
      const result = reconstructActualText({
        displayText: 'Pasted: [Pasted text #1 +100 lines]',
        tokenMap: {
          '[Pasted text #1 +100 lines]': longText,
        },
      });

      expect(result).toBe(`Pasted: ${longText}`);
    });

    it('should preserve order with multiple tokens', () => {
      const result = reconstructActualText({
        displayText: '[Pasted text #2 +2 lines] then [Pasted text #1 +2 lines]',
        tokenMap: {
          '[Pasted text #1 +2 lines]': 'a\nb',
          '[Pasted text #2 +2 lines]': 'x\ny',
        },
      });

      expect(result).toBe('x\ny then a\nb');
    });
  });

  describe('edge cases', () => {
    it('should handle empty text', () => {
      expect(countLines('')).toBe(1);
      expect(shouldCollapsePaste('')).toBe(false);
    });

    it('should handle single newline', () => {
      expect(countLines('\n')).toBe(1);
      expect(shouldCollapsePaste('\n')).toBe(false);
    });

    it('should handle text with only newlines', () => {
      expect(countLines('\n\n\n\n\n\n')).toBe(6);
      expect(shouldCollapsePaste('\n\n\n\n\n\n')).toBe(true);
    });

    it('should handle special characters in pasted text', () => {
      const result = createPasteToken({
        text: 'line1!@#$\nline2%^&*\nline3()_+\nline4{}\nline5[]\nline6<>',
        tokenNumber: 1,
      });

      expect(result.token).toBe('[Pasted text #1 +6 lines]');
      expect(result.actualText).toContain('!@#$');
    });
  });
});
