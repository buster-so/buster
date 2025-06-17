import { describe, expect, it } from 'vitest';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../src/utils/streaming/optimistic-json-parser';

describe('OptimisticJsonParser', () => {
  describe('parse', () => {
    it('should parse complete JSON normally', () => {
      const json = '{"message": "Hello world", "status": "active"}';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(true);
      expect(result.parsed).toEqual({
        message: 'Hello world',
        status: 'active',
      });
      expect(result.extractedValues.get('message')).toBe('Hello world');
      expect(result.extractedValues.get('status')).toBe('active');
    });

    it('should optimistically parse incomplete string values', () => {
      const json = '{"final_response": "Hello wor';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.parsed).toEqual({
        final_response: 'Hello wor',
      });
      expect(result.extractedValues.get('final_response')).toBe('Hello wor');
    });

    it('should handle multiple incomplete fields', () => {
      const json = '{"thought": "I am thinking about", "nextThoughtNeeded": tru';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('thought')).toBe('I am thinking about');
      // Raw extraction should still find the boolean
      expect(result.extractedValues.get('nextThoughtNeeded')).toBe(true);
    });

    it('should handle nested incomplete JSON', () => {
      const json = '{"user": {"name": "John", "email": "john@ex';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.parsed).toEqual({
        user: {
          name: 'John',
          email: 'john@ex',
        },
      });
      expect(result.extractedValues.get('user.name')).toBe('John');
      expect(result.extractedValues.get('user.email')).toBe('john@ex');
    });

    it('should handle arrays in progress', () => {
      const json = '{"items": ["one", "two", "thr';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.parsed).toEqual({
        items: ['one', 'two', 'thr'],
      });
    });

    it('should extract raw values when optimistic parsing fails', () => {
      const json = '{"message": "Hello", "count": 42, "active": true, "nested": {"bad';
      const result = OptimisticJsonParser.parse(json);

      // Even if full parse fails, raw values should be extracted
      expect(result.extractedValues.get('message')).toBe('Hello');
      expect(result.extractedValues.get('count')).toBe(42);
      expect(result.extractedValues.get('active')).toBe(true);
    });

    it('should handle escaped quotes', () => {
      const json = '{"message": "Say \\"Hello\\" to';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.parsed).toEqual({
        message: 'Say "Hello" to',
      });
    });

    it('should handle empty input', () => {
      const result = OptimisticJsonParser.parse('');

      expect(result.isComplete).toBe(false);
      expect(result.parsed).toBe(null);
      expect(result.extractedValues.size).toBe(0);
    });

    it('should progressively build final_response for done tool', () => {
      const stages = [
        '{"final_response": "H',
        '{"final_response": "Hello',
        '{"final_response": "Hello, I can',
        '{"final_response": "Hello, I can help',
        '{"final_response": "Hello, I can help you with that."}',
      ];

      const results = stages.map((json) => {
        const result = OptimisticJsonParser.parse(json);
        return getOptimisticValue<string>(result.extractedValues, 'final_response', '');
      });

      expect(results).toEqual([
        'H',
        'Hello',
        'Hello, I can',
        'Hello, I can help',
        'Hello, I can help you with that.',
      ]);

      // Last one should be complete
      const lastResult = OptimisticJsonParser.parse(stages[stages.length - 1]);
      expect(lastResult.isComplete).toBe(true);
    });
  });

  describe('getOptimisticValue', () => {
    it('should retrieve values with type safety', () => {
      const map = new Map<string, unknown>([
        ['message', 'Hello'],
        ['count', 42],
        ['active', true],
        ['user.name', 'John'],
      ]);

      expect(getOptimisticValue<string>(map, 'message')).toBe('Hello');
      expect(getOptimisticValue<number>(map, 'count')).toBe(42);
      expect(getOptimisticValue<boolean>(map, 'active')).toBe(true);
      expect(getOptimisticValue<string>(map, 'user.name')).toBe('John');
    });

    it('should return default value when key not found', () => {
      const map = new Map<string, unknown>();

      expect(getOptimisticValue<string>(map, 'missing', 'default')).toBe('default');
      expect(getOptimisticValue<number>(map, 'missing', 0)).toBe(0);
      expect(getOptimisticValue<boolean>(map, 'missing', false)).toBe(false);
    });

    it('should return undefined when no default provided', () => {
      const map = new Map<string, unknown>();

      expect(getOptimisticValue<string>(map, 'missing')).toBeUndefined();
    });
  });
});
