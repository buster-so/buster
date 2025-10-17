import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readContextFile } from './context-file';

describe('readContextFile', () => {
  const testDir = join(__dirname, '.test-context-files');

  beforeAll(() => {
    // Create test directory and files
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });

    // Create test files
    writeFileSync(join(testDir, 'test-context.txt'), 'This is test context content');

    // Create nested directory and file
    mkdirSync(join(testDir, 'nested'), { recursive: true });
    writeFileSync(join(testDir, 'nested', 'context.txt'), 'Nested context content');

    writeFileSync(
      join(testDir, 'multiline.txt'),
      'Line 1\nLine 2\nLine 3\nThis has multiple lines'
    );
  });

  afterAll(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  describe('absolute paths', () => {
    it('should read file content from absolute path', () => {
      const filePath = join(testDir, 'test-context.txt');
      const content = readContextFile(filePath, '/tmp');

      expect(content).toBe('This is test context content');
    });

    it('should read file content from nested absolute path', () => {
      const filePath = join(testDir, 'nested', 'context.txt');
      const content = readContextFile(filePath, '/tmp');

      expect(content).toBe('Nested context content');
    });

    it('should preserve multiline content', () => {
      const filePath = join(testDir, 'multiline.txt');
      const content = readContextFile(filePath, '/tmp');

      expect(content).toBe('Line 1\nLine 2\nLine 3\nThis has multiple lines');
    });
  });

  describe('relative paths', () => {
    it('should resolve relative path from working directory', () => {
      writeFileSync(join(testDir, 'relative-test.txt'), 'Relative content');

      const content = readContextFile('relative-test.txt', testDir);

      expect(content).toBe('Relative content');
    });

    it('should resolve nested relative path from working directory', () => {
      const content = readContextFile('nested/context.txt', testDir);

      expect(content).toBe('Nested context content');
    });

    it('should resolve parent directory relative paths', () => {
      const nestedDir = join(testDir, 'nested');
      const content = readContextFile('../test-context.txt', nestedDir);

      expect(content).toBe('This is test context content');
    });
  });

  describe('error handling', () => {
    it('should throw error when file does not exist (absolute path)', () => {
      const nonExistentPath = join(testDir, 'does-not-exist.txt');

      expect(() => readContextFile(nonExistentPath, '/tmp')).toThrow(
        `Context file not found: ${nonExistentPath}`
      );
    });

    it('should throw error when file does not exist (relative path)', () => {
      const fullPath = join(testDir, 'missing.txt');

      expect(() => readContextFile('missing.txt', testDir)).toThrow(
        `Context file not found: ${fullPath}`
      );
    });

    it('should throw error when path is a directory', () => {
      expect(() => readContextFile(testDir, '/tmp')).toThrow('Failed to read context file');
    });
  });

  describe('edge cases', () => {
    it('should handle empty file', () => {
      const emptyFilePath = join(testDir, 'empty.txt');
      writeFileSync(emptyFilePath, '');

      const content = readContextFile(emptyFilePath, '/tmp');

      expect(content).toBe('');
    });

    it('should handle file with special characters', () => {
      const specialContent = 'Special: ñ é ü 中文 🚀 \t\n';
      const specialFilePath = join(testDir, 'special.txt');
      writeFileSync(specialFilePath, specialContent);

      const content = readContextFile(specialFilePath, '/tmp');

      expect(content).toBe(specialContent);
    });

    it('should handle large content', () => {
      const largeContent = 'A'.repeat(10000);
      const largeFilePath = join(testDir, 'large.txt');
      writeFileSync(largeFilePath, largeContent);

      const content = readContextFile(largeFilePath, '/tmp');

      expect(content).toBe(largeContent);
      expect(content.length).toBe(10000);
    });
  });
});
