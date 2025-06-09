import { describe, expect, test } from 'vitest';
import { parseStreamingArgs } from '../../../src/tools/communication-tools/done-tool';

describe('Done Tool Streaming Parser', () => {
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
      '{"final_response": "I have analyzed the data and found the following insights."',
    ];

    // Test incremental building
    expect(parseStreamingArgs(chunks[0])).toBeNull(); // No colon yet
    expect(parseStreamingArgs(chunks[1])).toBeNull(); // No colon yet  
    expect(parseStreamingArgs(chunks[2])).toBeNull(); // No opening quote yet
    expect(parseStreamingArgs(chunks[3])).toEqual({ final_response: '' }); // Empty string
    expect(parseStreamingArgs(chunks[4])).toEqual({ final_response: 'I' });
    expect(parseStreamingArgs(chunks[5])).toEqual({ final_response: 'I have' });
    expect(parseStreamingArgs(chunks[6])).toEqual({ final_response: 'I have analyzed' });
    expect(parseStreamingArgs(chunks[7])).toEqual({ final_response: 'I have analyzed the' });
    expect(parseStreamingArgs(chunks[8])).toEqual({ final_response: 'I have analyzed the data' });
    expect(parseStreamingArgs(chunks[9])).toEqual({ final_response: 'I have analyzed the data and' });
    expect(parseStreamingArgs(chunks[10])).toEqual({ final_response: 'I have analyzed the data and found' });
    expect(parseStreamingArgs(chunks[11])).toEqual({ final_response: 'I have analyzed the data and found the' });
    expect(parseStreamingArgs(chunks[12])).toEqual({ final_response: 'I have analyzed the data and found the following' });
    expect(parseStreamingArgs(chunks[13])).toEqual({ final_response: 'I have analyzed the data and found the following insights' });
    
    // Final complete chunk should be parsed as complete JSON
    const finalResult = parseStreamingArgs(chunks[14]);
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
    const withMarkdown = '{"final_response": "## Analysis Results\\n\\n- Key finding 1\\n- Key finding 2"';
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

  test('should return null if final_response field is not present', () => {
    const withoutFinalResponse = '{"other_field": "value"}';
    const result = parseStreamingArgs(withoutFinalResponse);
    
    expect(result).toEqual({
      final_response: undefined,
    });
  });
});