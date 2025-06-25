import { describe, expect, it } from 'vitest';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../src/utils/streaming/optimistic-json-parser';

describe('OptimisticJsonParser - Stress Tests and Complex Scenarios', () => {
  describe('Many Keys Streaming', () => {
    it('should handle objects with 50+ keys streaming in', () => {
      const keys = Array.from({ length: 50 }, (_, i) => `key${i}`);
      let json = '{';

      // Test progressive parsing as keys are added
      for (let i = 0; i < keys.length; i++) {
        if (i > 0) json += ', ';
        json += `"${keys[i]}": "value${i}"`;

        // Test every 10 keys
        if (i % 10 === 9) {
          const result = OptimisticJsonParser.parse(json);
          expect(result.isComplete).toBe(false);

          // Should have extracted all keys so far
          for (let j = 0; j <= i; j++) {
            const key = keys[j]!;
            const value = result.extractedValues.get(key);
            expect(value).toBe(`value${j}`);
          }
        }
      }

      json += '}';
      const finalResult = OptimisticJsonParser.parse(json);
      expect(finalResult.isComplete).toBe(true);
      expect(finalResult.extractedValues.size).toBe(50);
    });

    it('should handle streaming with mixed value types across many keys', () => {
      const stages = [
        '{"str1": "hello", "num1": 42, "bool1": true, "null1": null, "arr1": [1, 2, 3], "obj1": {"nested": "value"}, "str2": "world", "num2": 3.14, "bool2": false, "null2": n',
        '{"str1": "hello", "num1": 42, "bool1": true, "null1": null, "arr1": [1, 2, 3], "obj1": {"nested": "value"}, "str2": "world", "num2": 3.14, "bool2": false, "null2": null, "arr2": ["a", "b", "c"], "obj2": {"deep": {"deeper": "val',
        '{"str1": "hello", "num1": 42, "bool1": true, "null1": null, "arr1": [1, 2, 3], "obj1": {"nested": "value"}, "str2": "world", "num2": 3.14, "bool2": false, "null2": null, "arr2": ["a", "b", "c"], "obj2": {"deep": {"deeper": "value"}}, "str3": "test\\nwith\\nnewlines", "num3": -999.99, "bool3": t',
      ];

      stages.forEach((json, index) => {
        const result = OptimisticJsonParser.parse(json);

        // Check progressive availability
        expect(result.extractedValues.get('str1')).toBe('hello');
        expect(result.extractedValues.get('num1')).toBe(42);
        expect(result.extractedValues.get('bool1')).toBe(true);
        expect(result.extractedValues.get('null1')).toBe(null);

        if (index >= 1) {
          expect(result.extractedValues.get('null2')).toBe(null);
        }

        if (index >= 2) {
          expect(result.extractedValues.get('str3')).toBe('test\\nwith\\nnewlines');
          expect(result.extractedValues.get('bool3')).toBe(true);
        }
      });
    });
  });

  describe('Complex Escaped Characters', () => {
    it('should handle all JSON escape sequences', () => {
      const json =
        '{"quote": "\\"quoted\\"", "backslash": "path\\\\to\\\\file", "slash": "http:\\/\\/example.com", "backspace": "before\\bafter", "formfeed": "page\\fbreak", "newline": "line1\\nline2", "return": "line1\\rline2", "tab": "col1\\tcol2", "unicode": "\\u0048\\u0065\\u006C\\u006C\\u006F", "emoji": "\\uD83D\\uDE00"}';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(true);
      expect(result.parsed).toEqual({
        quote: '"quoted"',
        backslash: 'path\\to\\file',
        slash: 'http://example.com',
        backspace: 'before\bafter',
        formfeed: 'page\fbreak',
        newline: 'line1\nline2',
        return: 'line1\rline2',
        tab: 'col1\tcol2',
        unicode: 'Hello',
        emoji: '😀',
      });
    });

    it('should handle incomplete escape sequences', () => {
      const stages = [
        '{"escape": "test\\',
        '{"escape": "test\\n',
        '{"escape": "test\\nmore\\',
        '{"escape": "test\\nmore\\t',
        '{"escape": "test\\nmore\\ttabs\\',
        '{"escape": "test\\nmore\\ttabs\\"quo',
      ];

      for (const json of stages) {
        const result = OptimisticJsonParser.parse(json);
        expect(result.isComplete).toBe(false);
        // Should still extract what it can
        const value = result.extractedValues.get('escape');
        expect(value).toBeDefined();
        expect(typeof value).toBe('string');
      }
    });

    it('should handle mixed quotes and escapes in SQL-like content', () => {
      const json = `{"sql": "SELECT * FROM users WHERE name = 'John\\'s' AND status = \\"active\\" AND description LIKE '%test\\\\%' ORDER BY created_at", "incomplete": "SELECT * FROM products WHERE category = \\"electro`;
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('sql')).toContain("John\\'s");
      expect(result.extractedValues.get('sql')).toContain('\\"active\\"');
      expect(result.extractedValues.get('sql')).toContain('test\\\\%');
      expect(result.extractedValues.get('incomplete')).toBe(
        'SELECT * FROM products WHERE category = \\"electro'
      );
    });
  });

  describe('Long Streaming Content', () => {
    it('should handle very long string values streaming in chunks', () => {
      const longText = 'Lorem ipsum '.repeat(1000); // ~12,000 chars
      const chunks = [];

      // Simulate streaming in 1000-char chunks
      let json = '{"content": "';
      for (let i = 0; i < longText.length; i += 1000) {
        json += longText.substring(i, i + 1000);
        chunks.push(json);
      }

      // Test a few chunks
      const testChunks = [chunks[0], chunks[5], chunks[chunks.length - 1]];
      for (const chunk of testChunks) {
        if (chunk === undefined) continue;
        const result = OptimisticJsonParser.parse(chunk);
        expect(result.isComplete).toBe(false);
        const content = result.extractedValues.get('content');
        expect(content).toBeDefined();
        expect(typeof content).toBe('string');
        expect((content as string).length).toBeGreaterThan(0);
      }
    });

    it('should handle streaming JSON with code snippets', () => {
      const codeJson = `{
        "language": "javascript",
        "code": "function example() {\\n  const obj = {\\"key\\": \\"value\\", 'single': true};\\n  console.log(\\"Hello\\\\nWorld\\");\\n  return obj;\\n}",
        "description": "This function demonstrates various quote types and escape sequences",
        "metadata": {
          "lines": 5,
          "complexity": "low",
          "tags": ["example", "quotes", "escapes"]
        },
        "incomplete": "function test() {\\n  const data = {\\"id\\": 123, \\"name\\": \\"`;

      const result = OptimisticJsonParser.parse(codeJson);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('language')).toBe('javascript');
      expect(result.extractedValues.get('code')).toContain('console.log');
      expect(result.extractedValues.get('description')).toContain('quote types');
      expect(result.extractedValues.get('metadata.lines')).toBe(5);
      expect(result.extractedValues.get('metadata.complexity')).toBe('low');
    });
  });

  describe('Real-world Tool Call Scenarios', () => {
    it('should handle streaming file creation with complex YAML', () => {
      const stages = [
        '{"files": [{"name": "complex.yml", "yml_content": "version: 2\\n\\nmodels:\\n  - name: users\\n    description: |\\n      This is a multi-line\\n      description with \\"quotes\\"\\n      and special chars: ${}[]\\n    columns:\\n      - name: id\\n        description: \\"Primary key\\"\\n      - name: email\\n        tests:\\n          - unique\\n          - not_null\\n      - name: metadata\\n        description: \\"JSON field with {nested: ',
        '{"files": [{"name": "complex.yml", "yml_content": "version: 2\\n\\nmodels:\\n  - name: users\\n    description: |\\n      This is a multi-line\\n      description with \\"quotes\\"\\n      and special chars: ${}[]\\n    columns:\\n      - name: id\\n        description: \\"Primary key\\"\\n      - name: email\\n        tests:\\n          - unique\\n          - not_null\\n      - name: metadata\\n        description: \\"JSON field with {nested: \'data\'}\\"\\n\\nmetrics:\\n  - name: revenue\\n    sql: |\\n      SELECT SUM(amount)\\n      FROM orders\\n      WHERE status = \'completed\'\\n      AND date >= \'2024-01-01\'"}]}',
      ];

      stages.forEach((json, index) => {
        const result = OptimisticJsonParser.parse(json);

        if (index === 0) {
          expect(result.isComplete).toBe(false);
          // Should still extract the partial YAML
          const files = (result.parsed?.files as Array<{ yml_content: string }>) || [];
          if (files.length > 0) {
            expect(files[0]).toHaveProperty('yml_content');
          }
        } else {
          expect(result.isComplete).toBe(true);
          const files = result.parsed?.files as Array<{ yml_content: string }>;
          expect(files[0]?.yml_content).toContain('multi-line');
          expect(files[0]?.yml_content).toContain('"quotes"');
          expect(files[0]?.yml_content).toContain('${');
        }
      });
    });

    it('should handle streaming sequential thinking with markdown and code', () => {
      const thinkingJson = `{
        "thought": "Let me analyze this complex problem:\\n\\n## Step 1: Understanding the Requirements\\n\\nThe user wants to create a dashboard that:\\n- Shows **real-time** metrics\\n- Includes \`revenue\`, \`users\`, and \`conversion_rate\`\\n- Has filters for date range and product category\\n\\n## Step 2: SQL Analysis\\n\\n\`\`\`sql\\nSELECT \\n  DATE_TRUNC('day', created_at) as date,\\n  COUNT(DISTINCT user_id) as users,\\n  SUM(amount) as revenue,\\n  COUNT(DISTINCT CASE WHEN status = 'completed' THEN user_id END) * 100.0 / COUNT(DISTINCT user_id) as conversion_rate\\nFROM orders\\nWHERE created_at >= :start_date\\n  AND created_at <= :end_date\\n  AND (:category IS NULL OR category = :category)\\nGROUP BY 1\\nORDER BY 1\\n\`\`\`\\n\\n## Step 3: Implementation Plan\\n\\n1. Create the base metrics\\n2. Add dimensional slicing\\n3. Configure the dashboard layout\\n4. Test with sample data\\n\\nThis approach ensures **scalability** and *maintainability*.",
        "nextThoughtNeeded": false,
        "confidence": 0.95,
        "metadata": {
          "reasoning_type": "analytical",
          "tools_needed": ["create-metrics", "create-dashboards"],
          "estimated_complexity": "medium"
        }
      }`;

      const result = OptimisticJsonParser.parse(thinkingJson);

      expect(result.isComplete).toBe(true);
      const thought = result.extractedValues.get('thought') as string;
      expect(thought).toContain('```sql');
      expect(thought).toContain('DATE_TRUNC');
      expect(thought).toContain('**real-time**');
      expect(thought).toContain('`revenue`');
      expect(result.extractedValues.get('confidence')).toBe(0.95);
      expect(result.extractedValues.get('metadata.reasoning_type')).toBe('analytical');
    });

    it('should handle deeply nested tool arguments', () => {
      const deepJson = `{
        "action": "create",
        "config": {
          "database": {
            "connection": {
              "host": "localhost",
              "port": 5432,
              "ssl": {
                "enabled": true,
                "certificate": "-----BEGIN CERTIFICATE-----\\nMIIDXTCCAkWgAwIBAgIJAKl8LKnHwJLuMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV\\n-----END CERTIFICATE-----",
                "verify": true
              }
            },
            "pool": {
              "min": 2,
              "max": 10,
              "idle": 30000
            }
          },
          "features": {
            "analytics": {
              "enabled": true,
              "providers": ["google", "segment"],
              "custom_events": {
                "page_view": {
                  "track": true,
                  "properties": ["url", "title", "referrer"]
                },
                "conversion": {
                  "track": true,
                  "properties": ["value", "currency", "items"]
                }
              }
            }
          }
        },
        "partial": "some incomplete val`;

      const result = OptimisticJsonParser.parse(deepJson);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('action')).toBe('create');
      expect(result.extractedValues.get('config.database.connection.host')).toBe('localhost');
      expect(result.extractedValues.get('config.database.connection.port')).toBe(5432);
      expect(result.extractedValues.get('config.database.connection.ssl.enabled')).toBe(true);
      expect(result.extractedValues.get('config.database.pool.max')).toBe(10);
      expect(result.extractedValues.get('config.features.analytics.enabled')).toBe(true);
      expect(result.extractedValues.get('partial')).toBe('some incomplete val');
    });
  });

  describe('Edge Cases with Special Formats', () => {
    it('should handle JSON with regex patterns', () => {
      const json =
        '{"pattern": "/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$/", "flags": "gi", "test": "/\\\\d{3}-\\\\d{3}-\\\\d{4}/", "incomplete": "/^\\\\w+@[a-zA-Z_]+?\\\\.[a-zA-Z]{2,3}';
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('pattern')).toContain('@[a-zA-Z0-9.-]+');
      expect(result.extractedValues.get('flags')).toBe('gi');
      expect(result.extractedValues.get('test')).toContain('\\d{3}');
    });

    it('should handle JSON with HTML content', () => {
      const json = `{"html": "<div class=\\"container\\">\\n  <h1>Title with &quot;quotes&quot;</h1>\\n  <p>Content with &lt;special&gt; characters &amp; entities</p>\\n  <script>console.log('test');</script>\\n</div>", "partial": "<button onclick=\\"handleClick(\\\\'param\\\\')\\" class=\\"btn`;
      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('html')).toContain('class="container"');
      expect(result.extractedValues.get('html')).toContain('&quot;quotes&quot;');
      expect(result.extractedValues.get('html')).toContain('&lt;special&gt;');
      expect(result.extractedValues.get('partial')).toContain('onclick=');
    });

    it('should handle JSON with file paths across platforms', () => {
      const json = `{
        "windows": "C:\\\\Users\\\\John\\\\Documents\\\\file.txt",
        "unix": "/home/john/documents/file.txt",
        "unc": "\\\\\\\\server\\\\share\\\\folder\\\\file.txt",
        "url": "file:///C:/Users/John/Documents/file.txt",
        "relative": "..\\\\..\\\\data\\\\config.json",
        "spaces": "C:\\\\Program Files\\\\My App\\\\data files\\\\test.dat",
        "partial": "D:\\\\Projects\\\\my-app\\\\src\\\\components\\\\`;

      const result = OptimisticJsonParser.parse(json);

      expect(result.isComplete).toBe(false);
      expect(result.extractedValues.get('windows')).toBe('C:\\Users\\John\\Documents\\file.txt');
      expect(result.extractedValues.get('unc')).toBe('\\\\server\\share\\folder\\file.txt');
      expect(result.extractedValues.get('spaces')).toContain('Program Files');
      expect(result.extractedValues.get('partial')).toBe('D:\\Projects\\my-app\\src\\components\\');
    });
  });

  describe('Performance with Large Datasets', () => {
    it('should handle array with 1000 items streaming', () => {
      let json = '{"data": [';

      // Add 1000 items
      for (let i = 0; i < 1000; i++) {
        if (i > 0) json += ', ';
        json += `{"id": ${i}, "value": "item${i}"}`;

        // Test parsing at certain intervals
        if (i === 100 || i === 500 || i === 999) {
          const result = OptimisticJsonParser.parse(json);
          expect(result.isComplete).toBe(false);

          // Should have parsed up to this point
          if (result.parsed?.data) {
            expect(Array.isArray(result.parsed.data)).toBe(true);
          }
        }
      }

      json += ']}';
      const finalResult = OptimisticJsonParser.parse(json);
      expect(finalResult.isComplete).toBe(true);
      expect(finalResult.parsed?.data).toHaveLength(1000);
    });

    it('should handle streaming with many special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;\'",./<>?~';
      const stages = [];
      let json = '{"special": "';

      // Build up string with all special characters escaped
      for (let i = 0; i < specialChars.length; i++) {
        json += `\\${specialChars[i]} `;
        stages.push(json);
      }

      // Test a few stages
      const testStages = [stages[5], stages[15], stages[25]];
      for (const stage of testStages) {
        const result = OptimisticJsonParser.parse(stage!);
        expect(result.isComplete).toBe(false);
        const value = result.extractedValues.get('special');
        expect(value).toBeDefined();
        expect(typeof value).toBe('string');
      }
    });
  });
});
