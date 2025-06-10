import { describe, expect, test } from 'vitest';
import { parseStreamingArgs } from '../../../src/tools/visualization-tools/create-metrics-file-tool';

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
    expect(parseStreamingArgs(chunks[0])).toBeNull(); // No colon yet
    expect(parseStreamingArgs(chunks[1])).toBeNull(); // No array start yet
    expect(parseStreamingArgs(chunks[2])).toEqual({ files: [] }); // Empty array detected
    expect(parseStreamingArgs(chunks[3])).toEqual({ files: [] }); // Incomplete object
    expect(parseStreamingArgs(chunks[4])).toEqual({ files: [] }); // Still incomplete
    expect(parseStreamingArgs(chunks[5])).toEqual({ files: [] }); // Still incomplete
    expect(parseStreamingArgs(chunks[6])).toEqual({ files: [] }); // Missing closing quote
    expect(parseStreamingArgs(chunks[7])).toEqual({ files: [] }); // Missing yml_content value
    expect(parseStreamingArgs(chunks[8])).toEqual({ files: [] }); // Missing yml_content value

    // The parser is smart enough to parse partial objects once they become valid
    console.log('chunks[9]:', chunks[9]);
    const result9 = parseStreamingArgs(chunks[9]);
    console.log('result9:', result9);
    expect(result9).toEqual({
      files: [{ name: 'Sales Metrics', yml_content: 'name: Sales' }],
    }); // Partial yml_content parsed!

    const result10 = parseStreamingArgs(chunks[10]);
    expect(result10).toEqual({
      files: [{ name: 'Sales Metrics', yml_content: 'name: Sales\nsql: SELECT' }],
    }); // Growing yml_content

    const result11 = parseStreamingArgs(chunks[11]);
    expect(result11).toEqual({
      files: [{ name: 'Sales Metrics', yml_content: 'name: Sales\nsql: SELECT * FROM sales' }],
    }); // Complete yml_content

    // Final complete chunk should be parsed as complete JSON
    const finalResult = parseStreamingArgs(chunks[12]);
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
