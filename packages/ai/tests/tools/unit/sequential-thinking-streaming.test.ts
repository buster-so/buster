import { describe, expect, test } from 'vitest';
import { parseStreamingArgs } from '../../../src/tools/planning-thinking-tools/sequential-thinking-tool';

describe('Sequential Thinking Tool Streaming Parser', () => {
  test('should return null for empty or invalid input', () => {
    expect(parseStreamingArgs('')).toBeNull();
    expect(parseStreamingArgs('{')).toBeNull();
    expect(parseStreamingArgs('invalid json')).toBeNull();
    expect(parseStreamingArgs('{"other_field":')).toBeNull();
  });

  test('should parse complete JSON with all fields', () => {
    const completeJson = JSON.stringify({
      thought: 'I need to analyze this step by step',
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 5,
      isRevision: false,
      needsMoreThoughts: false,
      branchId: 'main',
    });

    const result = parseStreamingArgs(completeJson);

    expect(result).toEqual({
      thought: 'I need to analyze this step by step',
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 5,
      isRevision: false,
      needsMoreThoughts: false,
      branchId: 'main',
    });
  });

  test('should extract partial thought as it builds incrementally', () => {
    // Simulate the streaming chunks building up a thought
    const chunks = [
      '{"thought"',
      '{"thought":',
      '{"thought": "',
      '{"thought": "I',
      '{"thought": "I need',
      '{"thought": "I need to',
      '{"thought": "I need to analyze',
      '{"thought": "I need to analyze this",',
      '{"thought": "I need to analyze this", "nextThoughtNeeded"',
      '{"thought": "I need to analyze this", "nextThoughtNeeded":',
      '{"thought": "I need to analyze this", "nextThoughtNeeded": true',
      '{"thought": "I need to analyze this", "nextThoughtNeeded": true,',
      '{"thought": "I need to analyze this", "nextThoughtNeeded": true, "thoughtNumber": 1',
    ];

    // Test incremental building
    expect(parseStreamingArgs(chunks[0])).toBeNull(); // No colon yet
    expect(parseStreamingArgs(chunks[1])).toBeNull(); // No opening quote yet
    expect(parseStreamingArgs(chunks[2])).toEqual({ thought: '' }); // Empty string
    expect(parseStreamingArgs(chunks[3])).toEqual({ thought: 'I' });
    expect(parseStreamingArgs(chunks[4])).toEqual({ thought: 'I need' });
    expect(parseStreamingArgs(chunks[5])).toEqual({ thought: 'I need to' });
    expect(parseStreamingArgs(chunks[6])).toEqual({ thought: 'I need to analyze' });
    expect(parseStreamingArgs(chunks[7])).toEqual({ thought: 'I need to analyze this' });

    // As more fields are added
    expect(parseStreamingArgs(chunks[8])).toEqual({ thought: 'I need to analyze this' });
    expect(parseStreamingArgs(chunks[9])).toEqual({ thought: 'I need to analyze this' });
    expect(parseStreamingArgs(chunks[10])).toEqual({
      thought: 'I need to analyze this',
      nextThoughtNeeded: true,
    });
    expect(parseStreamingArgs(chunks[11])).toEqual({
      thought: 'I need to analyze this',
      nextThoughtNeeded: true,
    });
    expect(parseStreamingArgs(chunks[12])).toEqual({
      thought: 'I need to analyze this',
      nextThoughtNeeded: true,
      thoughtNumber: 1,
    });
  });

  test('should handle boolean fields correctly', () => {
    const withBooleans =
      '{"nextThoughtNeeded": true, "isRevision": false, "needsMoreThoughts": true';
    const result = parseStreamingArgs(withBooleans);

    expect(result).toEqual({
      nextThoughtNeeded: true,
      isRevision: false,
      needsMoreThoughts: true,
    });
  });

  test('should handle number fields correctly', () => {
    const withNumbers =
      '{"thoughtNumber": 3, "totalThoughts": 7, "revisesThought": 2, "branchFromThought": 1';
    const result = parseStreamingArgs(withNumbers);

    expect(result).toEqual({
      thoughtNumber: 3,
      totalThoughts: 7,
      revisesThought: 2,
      branchFromThought: 1,
    });
  });

  test('should handle escaped quotes in thought', () => {
    const withEscapedQuotes = '{"thought": "This is a \\"quoted\\" text"';
    const result = parseStreamingArgs(withEscapedQuotes);

    expect(result).toEqual({
      thought: 'This is a "quoted" text',
    });
  });

  test('should handle mixed field types', () => {
    const mixedFields =
      '{"thought": "Step 1 analysis", "thoughtNumber": 1, "nextThoughtNeeded": true, "isRevision": false';
    const result = parseStreamingArgs(mixedFields);

    expect(result).toEqual({
      thought: 'Step 1 analysis',
      thoughtNumber: 1,
      nextThoughtNeeded: true,
      isRevision: false,
    });
  });

  test('should handle string fields like branchId', () => {
    const withBranchId = '{"branchId": "alternative-path", "thought": "Exploring alternative"';
    const result = parseStreamingArgs(withBranchId);

    expect(result).toEqual({
      branchId: 'alternative-path',
      thought: 'Exploring alternative',
    });
  });

  test('should handle whitespace variations', () => {
    const withWhitespace =
      '{ "thought" : "Test" , "thoughtNumber" : 1 , "nextThoughtNeeded" : true';
    const result = parseStreamingArgs(withWhitespace);

    expect(result).toEqual({
      thought: 'Test',
      thoughtNumber: 1,
      nextThoughtNeeded: true,
    });
  });

  test('should handle complex thought with newlines and special characters', () => {
    const complexThought =
      '{"thought": "Step 1:\\nAnalyze the problem\\n- Check assumptions\\n- Review data"';
    const result = parseStreamingArgs(complexThought);

    expect(result).toEqual({
      thought: 'Step 1:\\nAnalyze the problem\\n- Check assumptions\\n- Review data',
    });
  });

  test('should return null if no recognized fields are present', () => {
    const withoutKnownFields = '{"unknown_field": "value", "other": 123';
    const result = parseStreamingArgs(withoutKnownFields);

    expect(result).toBeNull();
  });

  test('should handle optional fields correctly when present', () => {
    const withOptionalFields =
      '{"thought": "Revision", "isRevision": true, "revisesThought": 2, "branchFromThought": 1';
    const result = parseStreamingArgs(withOptionalFields);

    expect(result).toEqual({
      thought: 'Revision',
      isRevision: true,
      revisesThought: 2,
      branchFromThought: 1,
    });
  });

  test('should handle complete JSON with undefined fields correctly', () => {
    const jsonWithUndefined = JSON.stringify({
      thought: 'Complete thought',
      nextThoughtNeeded: false,
      thoughtNumber: 5,
      totalThoughts: 5,
      isRevision: false,
      needsMoreThoughts: false,
    });

    const result = parseStreamingArgs(jsonWithUndefined);

    expect(result).toEqual({
      thought: 'Complete thought',
      nextThoughtNeeded: false,
      thoughtNumber: 5,
      totalThoughts: 5,
      isRevision: false,
      needsMoreThoughts: false,
    });
  });
});
