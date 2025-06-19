import { describe, expect, it } from 'vitest';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../src/utils/streaming/optimistic-json-parser';

describe('OptimisticJsonParser - Edge Cases and Special Characters', () => {
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

    it('should handle incomplete strings with escape sequences', () => {
      const json = '{"message": "Say \\"Hello\\" to\\neveryone who';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('message')).toBe('Say "Hello" to\neveryone who');
    });

    it('should handle backslashes in strings', () => {
      const json = '{"path": "C:\\\\Users\\\\John\\\\Documents", "incomplete": "C:\\\\Users\\\\';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('path')).toBe('C:\\Users\\John\\Documents');
      expect(result.extractedValues.get('incomplete')).toBe('C:\\Users\\');
    });

    it('should handle unicode characters', () => {
      const json = '{"emoji": "Hello 👋 World 🌍", "chinese": "你好世界"}';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(true);
      expect(result.parsed).toEqual({
        emoji: 'Hello 👋 World 🌍',
        chinese: '你好世界',
      });
    });

    it('should handle mixed quotes and special chars', () => {
      const json =
        '{"code": "const msg = \\"It\'s working!\\\\n\\";", "partial": "console.log(\\"Test';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('code')).toBe('const msg = "It\'s working!\\n";');
      expect(result.extractedValues.get('partial')).toBe('console.log("Test');
    });
  });

  describe('Complex Nested Structures', () => {
    it('should handle deeply nested incomplete objects', () => {
      const json =
        '{"level1": {"level2": {"level3": {"level4": {"message": "Deep value", "status": "pen';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('level1.level2.level3.level4.message')).toBe('Deep value');
      expect(result.extractedValues.get('level1.level2.level3.level4.status')).toBe('pen');
    });

    it('should handle arrays with objects', () => {
      const json = '{"items": [{"id": 1, "name": "Item 1"}, {"id": 2, "name": "Item ';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.parsed).toBeTruthy();
      // The array should be partially parsed
      const items = result.parsed?.items as Array<{ id: number; name: string }>;
      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({ id: 1, name: 'Item 1' });
    });

    it('should handle mixed nested arrays and objects', () => {
      const json =
        '{"data": {"users": [{"name": "John", "tags": ["admin", "active"]}, {"name": "Jane", "tags": ["use';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.parsed).toBeTruthy();
    });
  });

  describe('Streaming Multi-Key Objects', () => {
    it('should progressively parse multiple keys', () => {
      const stages = [
        '{"first": "val',
        '{"first": "value1", "sec',
        '{"first": "value1", "second": "val',
        '{"first": "value1", "second": "value2", "thi',
        '{"first": "value1", "second": "value2", "third": "value3"}',
      ];

      stages.forEach((json, index) => {
        const result = OptimisticJsonParser.parse(json);
        const isLast = index === stages.length - 1;

        expect(result.isComplete).toBe(isLast);

        // Check progressive availability of values
        if (index >= 0) expect(result.extractedValues.has('first')).toBe(true);
        if (index >= 2) expect(result.extractedValues.has('second')).toBe(true);
        if (index >= 4) expect(result.extractedValues.has('third')).toBe(true);
      });
    });

    it('should handle different value types progressively', () => {
      const stages = [
        '{"str": "hello", "num": 4',
        '{"str": "hello", "num": 42, "bool": t',
        '{"str": "hello", "num": 42, "bool": true, "arr": [1, 2',
        '{"str": "hello", "num": 42, "bool": true, "arr": [1, 2, 3], "obj": {"nested": "va',
        '{"str": "hello", "num": 42, "bool": true, "arr": [1, 2, 3], "obj": {"nested": "value"}}',
      ];

      stages.forEach((json, index) => {
        const result = OptimisticJsonParser.parse(json);

        expect(result.extractedValues.get('str')).toBe('hello');

        // Number parsing only works when complete
        if (index === 0) {
          expect(result.extractedValues.get('num')).toBe(4);
        } else {
          expect(result.extractedValues.get('num')).toBe(42);
        }

        if (json.includes('bool')) {
          expect(result.extractedValues.get('bool')).toBe(true);
        }
      });
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    it('should handle null values', () => {
      const json = '{"value": null, "partial": nul';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      // Parsing fails for incomplete JSON, so parsed is null
      expect(result.parsed).toBe(null);
      // But raw extraction should work
      expect(result.extractedValues.get('value')).toBe(null);
      expect(result.extractedValues.get('partial')).toBe(null);
    });

    it('should handle empty strings and objects', () => {
      const json = '{"empty": "", "obj": {}, "arr": [], "partial": "';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('empty')).toBe('');
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const json = `{"long": "${longString}", "next": "val`;
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('long')).toBe(longString);
      expect(result.extractedValues.get('next')).toBe('val');
    });

    it('should handle scientific notation numbers', () => {
      const json = '{"sci": 1.23e-10, "big": 9.99e+100, "partial": 4.5e+';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('sci')).toBe(1.23e-10);
      expect(result.extractedValues.get('big')).toBe(9.99e100);
    });

    it('should handle negative numbers', () => {
      const json = '{"neg": -42, "decimal": -3.14159, "partial": -99';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('neg')).toBe(-42);
      // biome-ignore lint/suspicious/noApproximativeNumericConstant: <explanation>
      expect(result.extractedValues.get('decimal')).toBe(-3.14159);
      expect(result.extractedValues.get('partial')).toBe(-99);
    });

    it('should handle malformed JSON gracefully', () => {
      const malformed = [
        { json: '{"unclosed": "string', expectedKey: 'unclosed', shouldExtract: true },
        { json: '{"extra": "comma",}', expectedKey: 'extra', shouldExtract: true },
        { json: '{"missing" "colon"}', expectedKey: 'missing', shouldExtract: false },
        { json: '{"bad": "start', expectedKey: 'bad', shouldExtract: true },
        { json: '{"ok": "value", "broken": [1, 2', expectedKey: 'ok', shouldExtract: true },
      ];

      for (const { json, expectedKey, shouldExtract } of malformed) {
        const result = OptimisticJsonParser.parse(json);

        // Well-formed JSON will parse as complete
        if (json === '{"bad": "start"}') {
          expect(result.isComplete).toBe(true);
          expect(result.parsed).toEqual({ bad: 'start' });
        } else {
          expect(result.isComplete).toBe(false);

          // Should extract at least the valid parts when possible
          if (shouldExtract) {
            expect(result.extractedValues.has(expectedKey)).toBe(true);
          }
        }
      }
    });
  });

  describe('Real-world Streaming Scenarios', () => {
    it('should handle streaming tool arguments with special characters', () => {
      const stages = [
        '{"final_response": "Here\'s your SQL query:\\n\\n```sql\\nSELECT',
        '{"final_response": "Here\'s your SQL query:\\n\\n```sql\\nSELECT * FROM users\\nWHERE name = \\"John\\"',
        '{"final_response": "Here\'s your SQL query:\\n\\n```sql\\nSELECT * FROM users\\nWHERE name = \\"John\\"\\nAND status = \'active\';\\n```\\n\\nThis query will',
        '{"final_response": "Here\'s your SQL query:\\n\\n```sql\\nSELECT * FROM users\\nWHERE name = \\"John\\"\\nAND status = \'active\';\\n```\\n\\nThis query will find all active users named John."}',
      ];

      stages.forEach((json, index) => {
        const result = OptimisticJsonParser.parse(json);
        const response = getOptimisticValue<string>(result.extractedValues, 'final_response', '');

        expect(response).toBeTruthy();
        expect(response).toContain('SQL query');

        if (index === stages.length - 1) {
          expect(result.isComplete).toBe(true);
          expect(response).toContain('active users named John');
        }
      });
    });

    it('should handle file creation with YAML content', () => {
      const json =
        '{"files": [{"name": "metrics.yml", "yml_content": "version: 2\\n\\nmetrics:\\n  - name: revenue\\n    model: ref(\'orders\')\\n    calculation:\\n      method: sum\\n      sql: amount\\n    dimensions:\\n      - created_at\\n      - status"}]}';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(true);
      expect(result.parsed?.files).toHaveLength(1);
      const file = (result.parsed?.files as Array<{ name: string; yml_content: string }>)[0];
      expect(file?.name).toBe('metrics.yml');
      expect(file?.yml_content).toContain('version: 2');
      expect(file?.yml_content).toContain('dimensions:');
    });

    it('should handle sequential thinking with markdown', () => {
      const json =
        '{"thought": "Let me analyze this step by step:\\n\\n1. **First**, I need to understand the requirements\\n2. **Second**, I\'ll design the solution\\n3. **Third**, implement the code\\n\\nHere\'s my approach:", "nextThoughtNeeded": fals';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('thought')).toContain('**First**');
      expect(result.extractedValues.get('thought')).toContain('**Second**');
      expect(result.extractedValues.get('nextThoughtNeeded')).toBe(false);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle escape sequences at chunk boundaries', () => {
      // Simulate receiving data in chunks where escape sequence is split
      const fullJson = '{"message": "Line 1\\nLine 2"}';

      // Split at the backslash
      const chunk1 = fullJson.substring(0, fullJson.indexOf('\\n') + 1); // includes the backslash
      const chunk2 = fullJson.substring(fullJson.indexOf('\\n') + 1);

      // First chunk: '{"message": "Line 1\'
      const result1 = OptimisticJsonParser.parse(chunk1);
      expect(result1.isComplete).toBe(false);

      // Combined chunks should parse correctly
      const combined = chunk1 + chunk2;
      const result2 = OptimisticJsonParser.parse(combined);
      expect(result2.isComplete).toBe(true);
      expect(result2.parsed?.message).toBe('Line 1\nLine 2');
    });

    it('should handle quotes at chunk boundaries', () => {
      const fullJson = '{"message": "Hello \\"World\\""}';

      // Split at the escape sequence
      const chunk1 = fullJson.substring(0, fullJson.indexOf('\\"World') + 2);
      const result1 = OptimisticJsonParser.parse(chunk1);
      expect(result1.isComplete).toBe(false);
    });
  });
});
