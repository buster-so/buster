import { describe, expect, test } from 'vitest';
import { parseStreamingArgs } from './investigation-plan-tool';

describe('Investigation Plan Tool - Streaming Parser', () => {
  describe('parseStreamingArgs', () => {
    test('should parse complete JSON', () => {
      const input = JSON.stringify({
        current_progress: 'I have discovered patterns in sales data and tested initial hypotheses.',
        remaining_investigations:
          'Need to explore customer segments and investigate outliers in the high-spend group.',
        next_research_steps:
          'Query customer_segments table for descriptive fields, analyze outlier customers individually, investigate temporal patterns.',
        continue_research: true,
      });

      const result = parseStreamingArgs(input);

      expect(result).toEqual({
        current_progress: 'I have discovered patterns in sales data and tested initial hypotheses.',
        remaining_investigations:
          'Need to explore customer segments and investigate outliers in the high-spend group.',
        next_research_steps:
          'Query customer_segments table for descriptive fields, analyze outlier customers individually, investigate temporal patterns.',
        continue_research: true,
      });
    });

    test('should parse partial current_progress with regex fallback', () => {
      const input = '{"current_progress": "I have discovered sales patterns"';

      const result = parseStreamingArgs(input);

      expect(result).toEqual({
        current_progress: 'I have discovered sales patterns',
      });
    });

    test('should parse continue_research boolean', () => {
      const input = '{"continue_research": false, "current_progress": "Analysis complete"}';

      const result = parseStreamingArgs(input);

      expect(result).toEqual({
        current_progress: 'Analysis complete',
        continue_research: false,
      });
    });

    test('should handle escaped quotes in text fields', () => {
      const input =
        '{"remaining_investigations": "Need to explore \\"high-value\\" customer segments"}';

      const result = parseStreamingArgs(input);

      expect(result).toEqual({
        remaining_investigations: 'Need to explore "high-value" customer segments',
      });
    });

    test('should parse all fields when present', () => {
      const input = JSON.stringify({
        current_progress: 'Analyzed sales trends',
        remaining_investigations: 'Segment analysis needed',
        next_research_steps: 'Query demographics table',
        continue_research: true,
      });

      const result = parseStreamingArgs(input);

      expect(result).toEqual({
        current_progress: 'Analyzed sales trends',
        remaining_investigations: 'Segment analysis needed',
        next_research_steps: 'Query demographics table',
        continue_research: true,
      });
    });

    test('should return null for invalid input', () => {
      const input = '{"invalid": "data"}';

      const result = parseStreamingArgs(input);

      expect(result).toBeNull();
    });

    test('should throw error for non-string input', () => {
      expect(() => parseStreamingArgs(123 as any)).toThrow(
        'parseStreamingArgs expects string input, got number'
      );
    });

    test('should handle incomplete JSON gracefully', () => {
      const input = '{"current_progress": "Analyzing data';

      const result = parseStreamingArgs(input);

      expect(result).toEqual({
        current_progress: 'Analyzing data',
      });
    });

    test('should extract multiple fields when both are present', () => {
      const input = '{"current_progress": "Progress made", "continue_research": true}';

      const result = parseStreamingArgs(input);

      expect(result).toEqual({
        current_progress: 'Progress made',
        continue_research: true,
      });
    });

    test('should handle continue_research true and false values', () => {
      const inputTrue = '{"continue_research": true}';
      const inputFalse = '{"continue_research": false}';

      const resultTrue = parseStreamingArgs(inputTrue);
      const resultFalse = parseStreamingArgs(inputFalse);

      expect(resultTrue).toEqual({
        continue_research: true,
      });
      expect(resultFalse).toEqual({
        continue_research: false,
      });
    });

    test('should return null if no recognized fields are present', () => {
      const withoutKnownFields = '{"unknown_field": "value", "other": 123';
      const result = parseStreamingArgs(withoutKnownFields);

      expect(result).toBeNull();
    });

    test('should handle mixed partial and complete fields', () => {
      const input = '{"current_progress": "Partial analysis", "continue_research": tr';

      const result = parseStreamingArgs(input);

      expect(result).toEqual({
        current_progress: 'Partial analysis',
      });
    });

    test('should parse remaining_investigations field', () => {
      const input = '{"remaining_investigations": "Need to investigate customer churn patterns"}';

      const result = parseStreamingArgs(input);

      expect(result).toEqual({
        remaining_investigations: 'Need to investigate customer churn patterns',
      });
    });

    test('should parse next_research_steps field', () => {
      const input =
        '{"next_research_steps": "1. Query customer table 2. Analyze retention 3. Segment by tenure"}';

      const result = parseStreamingArgs(input);

      expect(result).toEqual({
        next_research_steps: '1. Query customer table 2. Analyze retention 3. Segment by tenure',
      });
    });
  });
});
