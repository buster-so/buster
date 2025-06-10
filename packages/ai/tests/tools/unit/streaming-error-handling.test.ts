import { describe, expect, test } from 'vitest';
import { parseStreamingArgs as parseDoneArgs } from '../../../src/tools/communication-tools/done-tool';
import { parseStreamingArgs as parseRespondWithoutAnalysisArgs } from '../../../src/tools/communication-tools/respond-without-analysis';
import { parseStreamingArgs as parseExecuteSqlArgs } from '../../../src/tools/database-tools/execute-sql';
import { parseStreamingArgs as parseSequentialArgs } from '../../../src/tools/planning-thinking-tools/sequential-thinking-tool';
import { parseStreamingArgs as parseCreateMetricsArgs } from '../../../src/tools/visualization-tools/create-metrics-file-tool';

describe('Streaming Parser Error Handling', () => {
  const parsers = [
    { name: 'done-tool', parser: parseDoneArgs },
    { name: 'respond-without-analysis', parser: parseRespondWithoutAnalysisArgs },
    { name: 'sequential-thinking', parser: parseSequentialArgs },
    { name: 'execute-sql', parser: parseExecuteSqlArgs },
    { name: 'create-metrics-file', parser: parseCreateMetricsArgs },
  ];

  describe('Input Type Validation', () => {
    for (const { name, parser } of parsers) {
      test(`${name} should throw error for null input`, () => {
        expect(() => parser(null as unknown as string)).toThrow(
          'parseStreamingArgs expects string input, got object'
        );
      });

      test(`${name} should throw error for undefined input`, () => {
        expect(() => parser(undefined as unknown as string)).toThrow(
          'parseStreamingArgs expects string input, got undefined'
        );
      });

      test(`${name} should throw error for number input`, () => {
        expect(() => parser(123 as unknown as string)).toThrow(
          'parseStreamingArgs expects string input, got number'
        );
      });

      test(`${name} should throw error for object input`, () => {
        expect(() => parser({} as unknown as string)).toThrow(
          'parseStreamingArgs expects string input, got object'
        );
      });

      test(`${name} should throw error for array input`, () => {
        expect(() => parser([] as unknown as string)).toThrow(
          'parseStreamingArgs expects string input, got object'
        );
      });
    }
  });

  describe('JSON Parse Error Handling (Should be Silent)', () => {
    for (const { name, parser } of parsers) {
      test(`${name} should return null for incomplete JSON (silent error)`, () => {
        const result = parser('{"incomplete":');
        expect(result).toBeNull();
      });

      test(`${name} should return null for malformed JSON (silent error)`, () => {
        const result = parser('{"malformed": "unclosed string');
        expect(result).toBeNull();
      });

      test(`${name} should return null for empty string (silent)`, () => {
        const result = parser('');
        expect(result).toBeNull();
      });
    }
  });

  describe('Regex Error Handling (Should Throw)', () => {
    for (const { name, parser } of parsers) {
      test(`${name} should handle valid string input without throwing`, () => {
        expect(() => parser('valid string')).not.toThrow();
      });
    }
  });

  describe('Successful Parsing (Should Work)', () => {
    test('done-tool should parse valid complete JSON', () => {
      const validJson = '{"final_response": "Test response"}';
      const result = parseDoneArgs(validJson);
      expect(result).toEqual({ final_response: 'Test response' });
    });

    test('respond-without-analysis should parse valid complete JSON', () => {
      const validJson = '{"final_response": "Test response"}';
      const result = parseRespondWithoutAnalysisArgs(validJson);
      expect(result).toEqual({ final_response: 'Test response' });
    });

    test('sequential-thinking should parse valid complete JSON', () => {
      const validJson = '{"thought": "Test thought", "nextThoughtNeeded": true}';
      const result = parseSequentialArgs(validJson);
      expect(result).toEqual({ thought: 'Test thought', nextThoughtNeeded: true });
    });

    test('execute-sql should parse valid complete JSON', () => {
      const validJson = '{"statements": ["SELECT * FROM test"]}';
      const result = parseExecuteSqlArgs(validJson);
      expect(result).toEqual({ statements: ['SELECT * FROM test'] });
    });

    test('create-metrics-file should parse valid complete JSON', () => {
      const validJson = '{"files": [{"name": "test", "yml_content": "content"}]}';
      const result = parseCreateMetricsArgs(validJson);
      expect(result).toEqual({ files: [{ name: 'test', yml_content: 'content' }] });
    });
  });
});
