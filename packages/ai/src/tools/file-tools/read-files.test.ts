import { describe, expect, test } from 'vitest';
import { parseStreamingArgs } from './read-files';

describe('Read Files Tool Streaming Parser', () => {
  test('should return null for empty or invalid input', () => {
    expect(parseStreamingArgs('')).toBe(null);
    expect(parseStreamingArgs('{')).toBe(null);
    expect(parseStreamingArgs('invalid json')).toBe(null);
  });

  test('should parse complete JSON with files array', () => {
    const input = '{"files": ["/path/to/file1.txt", "./relative/file2.ts"]}';
    const result = parseStreamingArgs(input);
    expect(result).toEqual({
      files: ['/path/to/file1.txt', './relative/file2.ts'],
    });
  });

  test('should handle empty files array', () => {
    const input = '{"files": []}';
    const result = parseStreamingArgs(input);
    expect(result).toEqual({ files: [] });
  });

  test('should extract partial files array', () => {
    const input = '{"files": ["/path/to/file1.txt"';
    const result = parseStreamingArgs(input);
    expect(result).toEqual({ files: ['/path/to/file1.txt'] });
  });

  test('should handle files field start without content', () => {
    const input = '{"files": [';
    const result = parseStreamingArgs(input);
    expect(result).toEqual({ files: [] });
  });

  test('should return null for non-array files field', () => {
    const input = '{"files": "not an array"}';
    const result = parseStreamingArgs(input);
    expect(result).toBe(null);
  });

  test('should handle escaped quotes in file paths', () => {
    const input = '{"files": ["/path/to/\\"quoted\\"/file.txt"]}';
    const result = parseStreamingArgs(input);
    expect(result).toEqual({
      files: ['/path/to/"quoted"/file.txt'],
    });
  });

  test('should extract multiple files from partial JSON', () => {
    const input = '{"files": ["/file1.txt", "/file2.txt", "/file3.txt"';
    const result = parseStreamingArgs(input);
    expect(result).toEqual({
      files: ['/file1.txt', '/file2.txt', '/file3.txt'],
    });
  });

  test('should throw error for non-string input', () => {
    expect(() => parseStreamingArgs(123 as any)).toThrow(
      'parseStreamingArgs expects string input, got number'
    );
  });

  test('should handle mixed absolute and relative paths', () => {
    const input = '{"files": ["/absolute/path.txt", "./relative/path.ts", "../parent/file.js"]}';
    const result = parseStreamingArgs(input);
    expect(result).toEqual({
      files: ['/absolute/path.txt', './relative/path.ts', '../parent/file.js'],
    });
  });
});
