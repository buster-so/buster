import { describe, expect, test } from 'vitest';
import { parseStreamingArgs } from '../../../src/tools/communication-tools/respond-without-analysis';
import { validateArrayAccess } from '../../../src/utils/validation-helpers';

describe('Respond Without Analysis Tool Streaming Parser', () => {
  test('should return null for empty or invalid input', () => {
    expect(parseStreamingArgs('')).toBeNull();
    expect(parseStreamingArgs('{')).toBeNull();
    expect(parseStreamingArgs('invalid json')).toBeNull();
    expect(parseStreamingArgs('{"other_field":')).toBeNull();
  });

  test('should parse complete JSON', () => {
    const completeJson = '{"final_response": "Analysis complete. Here are the results."}';
    const result = parseStreamingArgs(completeJson);

    expect(result).toEqual({
      final_response: 'Analysis complete. Here are the results.',
    });
  });

  test('should extract partial final_response as it builds incrementally', () => {
    // Simulate the streaming chunks we saw in the test
    const chunks = [
      '{"final_response',
      '{"final_response"',
      '{"final_response":',
      '{"final_response": "',
      '{"final_response": "I',
      '{"final_response": "I have',
      '{"final_response": "I have analyzed',
      '{"final_response": "I have analyzed the',
      '{"final_response": "I have analyzed the data',
      '{"final_response": "I have analyzed the data and',
      '{"final_response": "I have analyzed the data and found',
      '{"final_response": "I have analyzed the data and found the',
      '{"final_response": "I have analyzed the data and found the following',
      '{"final_response": "I have analyzed the data and found the following insights',
      '{"final_response": "I have analyzed the data and found the following insights."}',
    ];

    // Test incremental building
    expect(parseStreamingArgs(validateArrayAccess(chunks, 0, 'test chunks'))).toBeNull(); // No colon yet
    expect(parseStreamingArgs(validateArrayAccess(chunks, 1, 'test chunks'))).toBeNull(); // No colon yet
    expect(parseStreamingArgs(validateArrayAccess(chunks, 2, 'test chunks'))).toBeNull(); // No opening quote yet
    expect(parseStreamingArgs(validateArrayAccess(chunks, 3, 'test chunks'))).toEqual({
      final_response: '',
    }); // Empty string
    expect(parseStreamingArgs(validateArrayAccess(chunks, 4, 'test chunks'))).toEqual({
      final_response: 'I',
    });
    expect(parseStreamingArgs(validateArrayAccess(chunks, 5, 'test chunks'))).toEqual({
      final_response: 'I have',
    });
    expect(parseStreamingArgs(validateArrayAccess(chunks, 6, 'test chunks'))).toEqual({
      final_response: 'I have analyzed',
    });
    expect(parseStreamingArgs(validateArrayAccess(chunks, 7, 'test chunks'))).toEqual({
      final_response: 'I have analyzed the',
    });
    expect(parseStreamingArgs(validateArrayAccess(chunks, 8, 'test chunks'))).toEqual({
      final_response: 'I have analyzed the data',
    });
    expect(parseStreamingArgs(validateArrayAccess(chunks, 9, 'test chunks'))).toEqual({
      final_response: 'I have analyzed the data and',
    });
    expect(parseStreamingArgs(validateArrayAccess(chunks, 10, 'test chunks'))).toEqual({
      final_response: 'I have analyzed the data and found',
    });
    expect(parseStreamingArgs(validateArrayAccess(chunks, 11, 'test chunks'))).toEqual({
      final_response: 'I have analyzed the data and found the',
    });
    expect(parseStreamingArgs(validateArrayAccess(chunks, 12, 'test chunks'))).toEqual({
      final_response: 'I have analyzed the data and found the following',
    });
    expect(parseStreamingArgs(validateArrayAccess(chunks, 13, 'test chunks'))).toEqual({
      final_response: 'I have analyzed the data and found the following insights',
    });

    // Final complete chunk should be parsed as complete JSON
    const finalResult = parseStreamingArgs(validateArrayAccess(chunks, 14, 'test chunks'));
    expect(finalResult).toEqual({
      final_response: 'I have analyzed the data and found the following insights.',
    });
  });

  test('should handle escaped quotes in final_response', () => {
    const withEscapedQuotes = '{"final_response": "The \\"best\\" approach is"';
    const result = parseStreamingArgs(withEscapedQuotes);

    expect(result).toEqual({
      final_response: 'The "best" approach is',
    });
  });

  test('should handle newlines and markdown in final_response', () => {
    const withMarkdown =
      '{"final_response": "## Analysis Results\\n\\n- Key finding 1\\n- Key finding 2"';
    const result = parseStreamingArgs(withMarkdown);

    expect(result).toEqual({
      final_response: '## Analysis Results\\n\\n- Key finding 1\\n- Key finding 2',
    });
  });

  test('should handle whitespace variations', () => {
    const withWhitespace = '{ "final_response" : "Test response"';
    const result = parseStreamingArgs(withWhitespace);

    expect(result).toEqual({
      final_response: 'Test response',
    });
  });

  test('should return undefined for final_response if field is not present', () => {
    const withoutFinalResponse = '{"other_field": "value"}';
    const result = parseStreamingArgs(withoutFinalResponse);

    expect(result).toEqual({
      final_response: undefined,
    });
  });

  test('should handle complex markdown content', () => {
    const complexMarkdown =
      '{"final_response": "Based on my analysis:\\n\\n- **Revenue increased by 15%**\\n- Customer satisfaction improved\\n\\nRecommendations:\\n1. Continue current strategy\\n2. Expand to new markets"';
    const result = parseStreamingArgs(complexMarkdown);

    expect(result).toEqual({
      final_response:
        'Based on my analysis:\\n\\n- **Revenue increased by 15%**\\n- Customer satisfaction improved\\n\\nRecommendations:\\n1. Continue current strategy\\n2. Expand to new markets',
    });
  });

  test('should handle empty final_response', () => {
    const emptyResponse = '{"final_response": ""}';
    const result = parseStreamingArgs(emptyResponse);

    expect(result).toEqual({
      final_response: '',
    });
  });

  test('should handle final_response with special characters', () => {
    const withSpecialChars = '{"final_response": "Analysis: $1,234.56 (100%) - Success!"';
    const result = parseStreamingArgs(withSpecialChars);

    expect(result).toEqual({
      final_response: 'Analysis: $1,234.56 (100%) - Success!',
    });
  });
});
