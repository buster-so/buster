import { describe, expect, it } from 'vitest';
import { getOptimisticValue, OptimisticJsonParser } from './optimistic-json-parser';

describe('OptimisticJsonParser', () => {
  describe('Basic Parsing', () => {
    it('should parse complete simple JSON', () => {
      const json = '{"key": "value", "number": 42}';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(true);
      expect(result.parsed).toEqual({ key: 'value', number: 42 });
    });

    it('should extract values from incomplete JSON', () => {
      const json = '{"key": "value", "number": 42, "incomplete": "val';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('key')).toBe('value');
      expect(result.extractedValues.get('number')).toBe(42);
      expect(result.extractedValues.get('incomplete')).toBe('val');
    });

    it('should handle nested objects', () => {
      const json = '{"user": {"name": "John", "age": 30}, "active": true}';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(true);
      expect(result.parsed).toEqual({
        user: { name: 'John', age: 30 },
        active: true,
      });
    });

    it('should handle arrays', () => {
      const json = '{"items": [1, 2, 3], "tags": ["a", "b"]}';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(true);
      expect(result.parsed).toEqual({
        items: [1, 2, 3],
        tags: ['a', 'b'],
      });
    });
  });

  describe('Incomplete JSON Handling', () => {
    it('should extract values from incomplete nested objects', () => {
      const json = '{"user": {"name": "John", "age": 30, "city": "New';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      const userValue = result.extractedValues.get('user');
      expect(userValue).toEqual({
        name: 'John',
        age: 30,
        city: 'New',
      });
    });

    it('should handle incomplete arrays', () => {
      const json = '{"items": [1, 2, 3, 4';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('items')).toEqual([1, 2, 3, 4]);
    });

    it('should handle missing closing braces', () => {
      const json = '{"key1": "value1", "key2": "value2"';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('key1')).toBe('value1');
      expect(result.extractedValues.get('key2')).toBe('value2');
    });
  });

  describe('Special Characters and Escape Sequences', () => {
    it('should handle newlines and tabs in strings', () => {
      const json = '{"message": "Line 1\\nLine 2\\tTabbed", "status": "active"}';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(true);
      expect(result.parsed).toEqual({
        message: 'Line 1\nLine 2\tTabbed',
        status: 'active',
      });
    });

    it('should handle escape sequences in incomplete strings', () => {
      const json = '{"message": "Say \\"Hello\\" to\\neveryone who';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('message')).toBe('Say "Hello" to\neveryone who');
    });

    it('should handle backslashes in paths', () => {
      const json = '{"path": "C:\\\\Users\\\\John\\\\Documents"}';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(true);
      expect(result.parsed).toEqual({
        path: 'C:\\Users\\John\\Documents',
      });
    });

    it('should handle unicode characters', () => {
      const json = '{"emoji": "😀", "chinese": "你好", "special": "café"}';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(true);
      expect(result.parsed).toEqual({
        emoji: '😀',
        chinese: '你好',
        special: 'café',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty objects and arrays', () => {
      const json = '{"empty_obj": {}, "empty_arr": [], "null_val": null}';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(true);
      expect(result.parsed).toEqual({
        empty_obj: {},
        empty_arr: [],
        null_val: null,
      });
    });

    it('should handle boolean values', () => {
      const json = '{"is_active": true, "is_deleted": false}';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(true);
      expect(result.parsed).toEqual({
        is_active: true,
        is_deleted: false,
      });
    });

    it('should handle numeric edge cases', () => {
      const json = '{"zero": 0, "negative": -42, "float": 3.14, "scientific": 1.23e-4}';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(true);
      expect(result.parsed).toEqual({
        zero: 0,
        negative: -42,
        float: 3.14,
        scientific: 1.23e-4,
      });
    });

    it('should handle deeply nested structures', () => {
      const json = '{"a": {"b": {"c": {"d": {"e": "deep"}}}}}';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(true);
      expect(result.parsed).toEqual({
        a: { b: { c: { d: { e: 'deep' } } } },
      });
    });

    it('should handle mixed arrays', () => {
      const json = '{"mixed": [1, "two", true, null, {"nested": "obj"}, [1, 2]]}';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(true);
      expect(result.parsed).toEqual({
        mixed: [1, 'two', true, null, { nested: 'obj' }, [1, 2]],
      });
    });
  });

  describe('Large and Complex JSON', () => {
    it('should handle large objects with many fields', () => {
      const fields = Array.from({ length: 100 }, (_, i) => `"field${i}": "value${i}"`);
      const json = `{${fields.join(', ')}}`;
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(true);
      expect(Object.keys(result.parsed || {}).length).toBe(100);
    });

    it('should handle large arrays', () => {
      const items = Array.from({ length: 1000 }, (_, i) => i);
      const json = `{"large_array": [${items.join(', ')}]}`;
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(true);
      expect((result.parsed as any).large_array.length).toBe(1000);
    });

    it('should handle complex nested structure with partial data', () => {
      const json = `{
        "user": {
          "id": 123,
          "profile": {
            "name": "John Doe",
            "email": "john@example.com",
            "preferences": {
              "theme": "dark",
              "notifications": {
                "email": true,
                "push": false,
                "sms": "pendi`;

      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      const user = result.extractedValues.get('user');
      expect(user).toBeDefined();
      expect((user as any).profile.name).toBe('John Doe');
      expect((user as any).profile.preferences.notifications.sms).toBe('pendi');
    });
  });

  describe('getOptimisticValue Helper', () => {
    it('should extract simple values', () => {
      const result = OptimisticJsonParser.parse('{"key": "value"}');
      expect(getOptimisticValue(result.extractedValues, 'key')).toBe('value');
    });

    it('should extract nested values', () => {
      const json = '{"user": {"name": "John", "age": 30}}';
      const result = OptimisticJsonParser.parse(json);
      const user = result.extractedValues.get('user');
      expect(user).toEqual({ name: 'John', age: 30 });
    });

    it('should return undefined for non-existent keys', () => {
      const result = OptimisticJsonParser.parse('{"key": "value"}');
      expect(getOptimisticValue(result.extractedValues, 'nonexistent')).toBeUndefined();
    });

    it('should extract values from incomplete JSON', () => {
      const result = OptimisticJsonParser.parse('{"key": "val');
      expect(getOptimisticValue(result.extractedValues, 'key')).toBe('val');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', () => {
      const json = '{"key": "value", invalid}';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      // Should still extract valid values before the error
      expect(result.extractedValues.get('key')).toBe('value');
    });

    it('should handle empty input', () => {
      const result = OptimisticJsonParser.parse('');
      expect(result.isComplete).toBe(false);
      expect(result.parsed).toBeNull();
    });

    it('should handle whitespace-only input', () => {
      const result = OptimisticJsonParser.parse('   \n\t  ');
      expect(result.isComplete).toBe(false);
      expect(result.parsed).toBeNull();
    });

    it('should handle non-object JSON at root', () => {
      const arrayJson = '[1, 2, 3]';
      const result = OptimisticJsonParser.parse(arrayJson);
      expect(result.isComplete).toBe(true);
      expect(result.parsed).toEqual([1, 2, 3]);

      const stringJson = '"just a string"';
      const stringResult = OptimisticJsonParser.parse(stringJson);
      expect(stringResult.isComplete).toBe(true);
      expect(stringResult.parsed).toBe('just a string');
    });
  });
});
