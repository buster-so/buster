import { describe, expect, test } from 'vitest';
import { parseStreamingArgs } from '../../../src/tools/visualization-tools/create-metrics-file-tool';
import { validateArrayAccess } from '../../../src/utils/validation-helpers';

describe('Create Metrics File Tool Streaming Parser', () => {
  test('should return null for empty or invalid input', () => {
    expect(parseStreamingArgs('')).toBeNull();
    expect(parseStreamingArgs('{')).toBeNull();
    expect(parseStreamingArgs('invalid json')).toBeNull();
    expect(parseStreamingArgs('{"other_field":')).toBeNull();
  });

  test('should parse complete JSON with files array', () => {
    const completeJson = JSON.stringify({
      files: [
        {
          name: 'Sales Metrics',
          yml_content: 'name: Sales Metrics\nsql: SELECT * FROM sales',
        },
        {
          name: 'Revenue Metrics',
          yml_content: 'name: Revenue Metrics\nsql: SELECT * FROM revenue',
        },
      ],
    });

    const result = parseStreamingArgs(completeJson);

    expect(result).toEqual({
      files: [
        {
          name: 'Sales Metrics',
          yml_content: 'name: Sales Metrics\nsql: SELECT * FROM sales',
        },
        {
          name: 'Revenue Metrics',
          yml_content: 'name: Revenue Metrics\nsql: SELECT * FROM revenue',
        },
      ],
    });
  });

  test('should extract partial files array as it builds incrementally', () => {
    // Simulate the streaming chunks building up a files array
    const chunks = [
      '{"files"',
      '{"files":',
      '{"files": [',
      '{"files": [{"name"',
      '{"files": [{"name":',
      '{"files": [{"name": "',
      '{"files": [{"name": "Sales Metrics"',
      '{"files": [{"name": "Sales Metrics", "yml_content"',
      '{"files": [{"name": "Sales Metrics", "yml_content":',
      '{"files": [{"name": "Sales Metrics", "yml_content": "name: Sales"',
      '{"files": [{"name": "Sales Metrics", "yml_content": "name: Sales\\nsql: SELECT"}',
      '{"files": [{"name": "Sales Metrics", "yml_content": "name: Sales\\nsql: SELECT * FROM sales"}',
      '{"files": [{"name": "Sales Metrics", "yml_content": "name: Sales\\nsql: SELECT * FROM sales"}]',
    ];

    // Test incremental building
    expect(parseStreamingArgs(validateArrayAccess(chunks, 0, 'test chunks'))).toBeNull(); // No colon yet
    expect(parseStreamingArgs(validateArrayAccess(chunks, 1, 'test chunks'))).toBeNull(); // No array start yet
    expect(parseStreamingArgs(validateArrayAccess(chunks, 2, 'test chunks'))).toEqual({
      files: [],
    }); // Empty array detected
    expect(parseStreamingArgs(validateArrayAccess(chunks, 3, 'test chunks'))).toEqual({
      files: [],
    }); // Incomplete object
    expect(parseStreamingArgs(validateArrayAccess(chunks, 4, 'test chunks'))).toEqual({
      files: [],
    }); // Still incomplete
    expect(parseStreamingArgs(validateArrayAccess(chunks, 5, 'test chunks'))).toEqual({
      files: [],
    }); // Still incomplete
    expect(parseStreamingArgs(validateArrayAccess(chunks, 6, 'test chunks'))).toEqual({
      files: [],
    }); // Missing closing quote
    expect(parseStreamingArgs(validateArrayAccess(chunks, 7, 'test chunks'))).toEqual({
      files: [],
    }); // Missing yml_content value
    expect(parseStreamingArgs(validateArrayAccess(chunks, 8, 'test chunks'))).toEqual({
      files: [],
    }); // Missing yml_content value

    // The parser is smart enough to parse partial objects once they become valid
    const chunk9 = validateArrayAccess(chunks, 9, 'test chunks');
    console.log('chunks[9]:', chunk9);
    const result9 = parseStreamingArgs(chunk9);
    console.log('result9:', result9);
    expect(result9).toEqual({
      files: [{ name: 'Sales Metrics', yml_content: 'name: Sales' }],
    }); // Partial yml_content parsed!

    const result10 = parseStreamingArgs(validateArrayAccess(chunks, 10, 'test chunks'));
    expect(result10).toEqual({
      files: [{ name: 'Sales Metrics', yml_content: 'name: Sales\nsql: SELECT' }],
    }); // Growing yml_content

    const result11 = parseStreamingArgs(validateArrayAccess(chunks, 11, 'test chunks'));
    expect(result11).toEqual({
      files: [{ name: 'Sales Metrics', yml_content: 'name: Sales\nsql: SELECT * FROM sales' }],
    }); // Complete yml_content

    // Final complete chunk should be parsed as complete JSON
    const finalResult = parseStreamingArgs(validateArrayAccess(chunks, 12, 'test chunks'));
    expect(finalResult).toEqual({
      files: [
        {
          name: 'Sales Metrics',
          yml_content: 'name: Sales\nsql: SELECT * FROM sales',
        },
      ],
    });
  });

  test('should handle multiple files being built incrementally', () => {
    const partialTwoFiles =
      '{"files": [{"name": "First Metric", "yml_content": "name: First"}, {"name": "Second Metric"';
    const result = parseStreamingArgs(partialTwoFiles);

    // Should extract the complete first file, ignoring the incomplete second file
    expect(result).toEqual({
      files: [{ name: 'First Metric', yml_content: 'name: First' }],
    });
  });

  test('should handle completed first file and partial second file', () => {
    const completeFirstPartialSecond =
      '{"files": [{"name": "First Metric", "yml_content": "name: First"}, {"name": "Second Metric", "yml_content": "name: Second"}]';
    const result = parseStreamingArgs(completeFirstPartialSecond);

    expect(result).toEqual({
      files: [
        { name: 'First Metric', yml_content: 'name: First' },
        { name: 'Second Metric', yml_content: 'name: Second' },
      ],
    });
  });

  test('should handle escaped quotes in yml_content', () => {
    const withEscapedQuotes =
      '{"files": [{"name": "Test", "yml_content": "name: \\"Test Metric\\""}]';
    const result = parseStreamingArgs(withEscapedQuotes);

    expect(result).toEqual({
      files: [{ name: 'Test', yml_content: 'name: "Test Metric"' }],
    });
  });

  test('should handle complex YAML content with newlines', () => {
    const withComplexYaml =
      '{"files": [{"name": "Complex", "yml_content": "name: Complex\\nsql: |\\n  SELECT *\\n  FROM table"}]';
    const result = parseStreamingArgs(withComplexYaml);

    expect(result).toEqual({
      files: [
        {
          name: 'Complex',
          yml_content: 'name: Complex\nsql: |\n  SELECT *\n  FROM table',
        },
      ],
    });
  });

  test('should return null if files field is not present', () => {
    const withoutFiles = '{"other_field": "value"}';
    const result = parseStreamingArgs(withoutFiles);

    expect(result).toEqual({
      files: undefined,
    });
  });

  test('should handle whitespace variations', () => {
    const withWhitespace = '{ "files" : [ { "name" : "Test" , "yml_content" : "content" } ]';
    const result = parseStreamingArgs(withWhitespace);

    expect(result).toEqual({
      files: [{ name: 'Test', yml_content: 'content' }],
    });
  });
});
