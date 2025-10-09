import { describe, expect, it } from 'vitest';
import { getLastLines, getPreviewLines } from './content-preview';

describe('getPreviewLines', () => {
  it('should return all lines when expanded', () => {
    const content = 'line1\nline2\nline3\nline4\nline5\nline6';
    const result = getPreviewLines(content, 3, true);

    expect(result).toEqual(['line1', 'line2', 'line3', 'line4', 'line5', 'line6']);
  });

  it('should return first N lines when not expanded', () => {
    const content = 'line1\nline2\nline3\nline4\nline5\nline6';
    const result = getPreviewLines(content, 3, false);

    expect(result).toEqual(['line1', 'line2', 'line3']);
  });

  it('should handle content with fewer lines than maxLines', () => {
    const content = 'line1\nline2';
    const result = getPreviewLines(content, 5, false);

    expect(result).toEqual(['line1', 'line2']);
  });

  it('should handle empty content', () => {
    const content = '';
    const result = getPreviewLines(content, 5, false);

    expect(result).toEqual(['']);
  });

  it('should handle single line content', () => {
    const content = 'single line';
    const result = getPreviewLines(content, 5, false);

    expect(result).toEqual(['single line']);
  });
});

describe('getLastLines', () => {
  it('should return all lines when expanded', () => {
    const content = 'line1\nline2\nline3\nline4\nline5\nline6';
    const result = getLastLines(content, 3, true);

    expect(result).toEqual(['line1', 'line2', 'line3', 'line4', 'line5', 'line6']);
  });

  it('should return last N lines when not expanded', () => {
    const content = 'line1\nline2\nline3\nline4\nline5\nline6';
    const result = getLastLines(content, 3, false);

    expect(result).toEqual(['line4', 'line5', 'line6']);
  });

  it('should filter out empty lines', () => {
    const content = 'line1\n\nline2\n\nline3';
    const result = getLastLines(content, 2, false);

    expect(result).toEqual(['line2', 'line3']);
  });

  it('should handle content with fewer lines than maxLines', () => {
    const content = 'line1\nline2';
    const result = getLastLines(content, 5, false);

    expect(result).toEqual(['line1', 'line2']);
  });

  it('should handle empty content', () => {
    const content = '';
    const result = getLastLines(content, 5, false);

    expect(result).toEqual([]);
  });

  it('should handle content with only empty lines', () => {
    const content = '\n\n\n';
    const result = getLastLines(content, 5, false);

    expect(result).toEqual([]);
  });
});
