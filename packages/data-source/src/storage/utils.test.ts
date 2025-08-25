import { describe, expect, it } from 'vitest';
import { parseErrorMessage, sanitizeKey, toBuffer } from './utils';

describe('Storage Utils', () => {
  describe('sanitizeKey', () => {
    it('should remove leading slashes', () => {
      expect(sanitizeKey('/path/to/file.txt')).toBe('path/to/file.txt');
      expect(sanitizeKey('///multiple/slashes')).toBe('multiple/slashes');
    });

    it('should preserve keys without leading slashes', () => {
      expect(sanitizeKey('path/to/file.txt')).toBe('path/to/file.txt');
      expect(sanitizeKey('file.txt')).toBe('file.txt');
    });

    it('should handle empty strings', () => {
      expect(sanitizeKey('')).toBe('');
    });

    it('should handle single slash', () => {
      expect(sanitizeKey('/')).toBe('');
    });

    it('should preserve internal slashes', () => {
      expect(sanitizeKey('/path/with/many/slashes/')).toBe('path/with/many/slashes/');
    });

    it('should handle special characters', () => {
      expect(sanitizeKey('/special-chars_123.txt')).toBe('special-chars_123.txt');
      expect(sanitizeKey('/path with spaces/file.txt')).toBe('path with spaces/file.txt');
    });
  });

  describe('toBuffer', () => {
    it('should convert string to Buffer', () => {
      const result = toBuffer('test string');
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('test string');
    });

    it('should return Buffer as-is', () => {
      const buffer = Buffer.from('test buffer');
      const result = toBuffer(buffer);
      expect(result).toBe(buffer);
      expect(result.toString()).toBe('test buffer');
    });

    it('should handle empty string', () => {
      const result = toBuffer('');
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(0);
    });

    it('should handle unicode strings', () => {
      const unicodeStr = '👋 Hello 世界';
      const result = toBuffer(unicodeStr);
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe(unicodeStr);
    });

    it('should handle large strings', () => {
      const largeStr = 'x'.repeat(10000);
      const result = toBuffer(largeStr);
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(10000);
    });

    it('should preserve binary data in Buffer', () => {
      const binaryData = Buffer.from([0x00, 0x01, 0x02, 0xff]);
      const result = toBuffer(binaryData);
      expect(result).toBe(binaryData);
      expect(Array.from(result)).toEqual([0x00, 0x01, 0x02, 0xff]);
    });
  });

  describe('parseErrorMessage', () => {
    it('should extract message from Error object', () => {
      const error = new Error('Test error message');
      expect(parseErrorMessage(error)).toBe('Test error message');
    });

    it('should handle Error with empty message', () => {
      const error = new Error('');
      expect(parseErrorMessage(error)).toBe('');
    });

    it('should convert string to string', () => {
      expect(parseErrorMessage('string error')).toBe('string error');
    });

    it('should handle non-string, non-Error values', () => {
      expect(parseErrorMessage(123)).toBe('Unknown error occurred');
      expect(parseErrorMessage(true)).toBe('Unknown error occurred');
      expect(parseErrorMessage(false)).toBe('Unknown error occurred');
      expect(parseErrorMessage(null)).toBe('Unknown error occurred');
      expect(parseErrorMessage(undefined)).toBe('Unknown error occurred');
    });

    it('should handle objects with toString', () => {
      const obj = {
        toString() {
          return 'custom error';
        },
      };
      expect(parseErrorMessage(obj)).toBe('Unknown error occurred');
    });

    it('should handle plain objects', () => {
      const obj = { code: 'ERROR_CODE', message: 'error details' };
      expect(parseErrorMessage(obj)).toBe('Unknown error occurred');
    });

    it('should handle AWS SDK errors', () => {
      const awsError = {
        message: 'Access Denied',
        code: 'AccessDenied',
        statusCode: 403,
      };
      // AWS errors are Error instances
      const error = Object.assign(new Error('Access Denied'), awsError);
      expect(parseErrorMessage(error)).toBe('Access Denied');
    });

    it('should handle nested errors', () => {
      const innerError = new Error('Inner error');
      const outerError = new Error(`Outer error: ${innerError.message}`);
      expect(parseErrorMessage(outerError)).toBe('Outer error: Inner error');
    });

    it('should handle errors with stack traces', () => {
      const error = new Error('Error with stack');
      error.stack = 'Error: Error with stack\n    at test.js:1:1';
      expect(parseErrorMessage(error)).toBe('Error with stack');
    });

    it('should handle circular references safely', () => {
      const obj: any = { message: 'circular' };
      obj.self = obj;
      // This would normally throw with JSON.stringify
      // Our implementation returns 'Unknown error occurred' for objects
      expect(parseErrorMessage(obj)).toBe('Unknown error occurred');
    });
  });
});
