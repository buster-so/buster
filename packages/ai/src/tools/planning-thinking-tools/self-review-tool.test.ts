import { describe, expect, test } from 'vitest';
import { parseStreamingArgs } from './self-review-tool';

describe('Self Review Tool - Streaming Parser', () => {
  describe('parseStreamingArgs', () => {
    test('should parse complete JSON', () => {
      const input = JSON.stringify({
        review_thoughts: 'I have completed all metrics and they follow guidelines.',
        ready_to_complete: true,
      });

      const result = parseStreamingArgs(input);

      expect(result).toEqual({
        review_thoughts: 'I have completed all metrics and they follow guidelines.',
        ready_to_complete: true,
      });
    });

    test('should parse partial review_thoughts with regex fallback', () => {
      const input = '{"review_thoughts": "I have reviewed the metrics"';

      const result = parseStreamingArgs(input);

      expect(result).toEqual({
        review_thoughts: 'I have reviewed the metrics',
      });
    });

    test('should parse ready_to_complete boolean', () => {
      const input = '{"ready_to_complete": false, "review_thoughts": "Need more work"}';

      const result = parseStreamingArgs(input);

      expect(result).toEqual({
        review_thoughts: 'Need more work',
        ready_to_complete: false,
      });
    });

    test('should handle escaped quotes in review_thoughts', () => {
      const input = '{"review_thoughts": "I have \\"completed\\" all metrics"}';

      const result = parseStreamingArgs(input);

      expect(result).toEqual({
        review_thoughts: 'I have "completed" all metrics',
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
      const input = '{"review_thoughts": "Analyzing';

      const result = parseStreamingArgs(input);

      expect(result).toEqual({
        review_thoughts: 'Analyzing',
      });
    });

    test('should extract both fields when both are present', () => {
      const input = '{"review_thoughts": "All criteria met", "ready_to_complete": true}';

      const result = parseStreamingArgs(input);

      expect(result).toEqual({
        review_thoughts: 'All criteria met',
        ready_to_complete: true,
      });
    });

    test('should handle ready_to_complete true and false values', () => {
      const inputTrue = '{"ready_to_complete": true}';
      const inputFalse = '{"ready_to_complete": false}';

      const resultTrue = parseStreamingArgs(inputTrue);
      const resultFalse = parseStreamingArgs(inputFalse);

      expect(resultTrue).toEqual({
        ready_to_complete: true,
      });
      expect(resultFalse).toEqual({
        ready_to_complete: false,
      });
    });

    test('should return null if no recognized fields are present', () => {
      const withoutKnownFields = '{"unknown_field": "value", "other": 123';
      const result = parseStreamingArgs(withoutKnownFields);

      expect(result).toBeNull();
    });

    test('should handle mixed partial and complete fields', () => {
      const input = '{"review_thoughts": "Partial analysis", "ready_to_complete": tr';

      const result = parseStreamingArgs(input);

      expect(result).toEqual({
        review_thoughts: 'Partial analysis',
      });
    });
  });
});
