import { describe, it, expect } from 'vitest';
import { truncateWithEllipsis } from './titleHelpers';

describe('truncateWithEllipsis', () => {
  it('should return the original text when shorter than maxLength', () => {
    const shortText = 'Short text';
    expect(truncateWithEllipsis(shortText)).toBe(shortText);
  });

  it('should truncate text with ellipsis when longer than default maxLength', () => {
    const longText =
      'This is a very long text that should be truncated because it exceeds the default max length of 52 characters';
    const result = truncateWithEllipsis(longText);

    // The result should be shorter than the original
    expect(result.length).toBeLessThan(longText.length);

    // Should match the default max length (including the ellipsis)
    expect(result.length).toBeLessThanOrEqual(52);

    // Should end with ellipsis
    expect(result.endsWith('...')).toBe(true);
  });

  it('should truncate to the specified maxLength', () => {
    const longText = 'This text should be truncated to 20 characters';
    const maxLength = 20;
    const result = truncateWithEllipsis(longText, maxLength);

    // Should match the specified max length (including the ellipsis)
    expect(result.length).toBeLessThanOrEqual(maxLength);

    // Should end with ellipsis
    expect(result.endsWith('...')).toBe(true);
  });

  it('should handle edge case with maxLength less than 4', () => {
    // Testing with very small maxLength value
    // lodash/truncate handles the ellipsis calculations internally
    const text = 'Some text';
    const maxLength = 3;
    const result = truncateWithEllipsis(text, maxLength);

    expect(result.length).toBeLessThanOrEqual(maxLength);
  });

  it('should handle empty string', () => {
    const emptyText = '';
    expect(truncateWithEllipsis(emptyText)).toBe(emptyText);
  });

  it('should handle strings exactly at the maxLength boundary', () => {
    const text = 'a'.repeat(52); // Exactly the default maxLength
    expect(truncateWithEllipsis(text)).toBe(text);

    const text2 = 'a'.repeat(53); // One over the default maxLength
    expect(truncateWithEllipsis(text2).length).toBeLessThan(text2.length);
  });
});
