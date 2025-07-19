import { existsSync, mkdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { editMultipleFiles, editSingleFile } from './edit_files-functions';

describe('edit_files-functions', () => {
  const testDir = join(process.cwd(), 'test-files');
  const testFile1 = join(testDir, 'test1.txt');
  const testFile2 = join(testDir, 'test2.txt');
  const nonExistentFile = join(testDir, 'nonexistent.txt');

  beforeEach(() => {
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }

    writeFileSync(testFile1, 'Hello world\nThis is a test file\nHello again');
    writeFileSync(testFile2, 'Another test file\nWith different content');
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('editSingleFile', () => {
    it('should successfully replace text when find string appears exactly once', () => {
      const result = editSingleFile({
        filePath: testFile1,
        findString: 'This is a test file',
        replaceString: 'This is a modified file',
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(testFile1);
      expect(result.message).toContain('Successfully replaced');
      expect(result.error).toBeUndefined();
    });

    it('should return error when file does not exist', () => {
      const result = editSingleFile({
        filePath: nonExistentFile,
        findString: 'test',
        replaceString: 'replacement',
      });

      expect(result.success).toBe(false);
      expect(result.filePath).toBe(nonExistentFile);
      expect(result.error).toContain('File not found');
      expect(result.message).toBeUndefined();
    });

    it('should return error when find string is not found', () => {
      const result = editSingleFile({
        filePath: testFile1,
        findString: 'nonexistent text',
        replaceString: 'replacement',
      });

      expect(result.success).toBe(false);
      expect(result.filePath).toBe(testFile1);
      expect(result.error).toContain('Find string not found');
      expect(result.message).toBeUndefined();
    });

    it('should return error when find string appears multiple times', () => {
      const result = editSingleFile({
        filePath: testFile1,
        findString: 'Hello',
        replaceString: 'Hi',
      });

      expect(result.success).toBe(false);
      expect(result.filePath).toBe(testFile1);
      expect(result.error).toContain('appears 2 times');
      expect(result.error).toContain('more specific string');
      expect(result.message).toBeUndefined();
    });

    it('should handle special regex characters in find string', () => {
      writeFileSync(testFile1, 'Price: $10.99\nOther content');

      const result = editSingleFile({
        filePath: testFile1,
        findString: '$10.99',
        replaceString: '$15.99',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully replaced');
    });

    it('should handle relative file paths', () => {
      const relativePath = 'test-files/test1.txt';

      const result = editSingleFile({
        filePath: relativePath,
        findString: 'This is a test file',
        replaceString: 'This is a modified file',
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(relativePath);
    });

    it('should handle multiline find strings', () => {
      const result = editSingleFile({
        filePath: testFile1,
        findString: 'Hello world\nThis is a test file',
        replaceString: 'Greetings\nThis is a modified file',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully replaced');
    });
  });

  describe('editMultipleFiles', () => {
    it('should process multiple successful edits', () => {
      const edits = [
        {
          filePath: testFile1,
          findString: 'This is a test file',
          replaceString: 'This is a modified file',
        },
        {
          filePath: testFile2,
          findString: 'Another test file',
          replaceString: 'Another modified file',
        },
      ];

      const results = editMultipleFiles(edits);

      expect(results).toHaveLength(2);
      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(true);
      expect(results[0]?.filePath).toBe(testFile1);
      expect(results[1]?.filePath).toBe(testFile2);
    });

    it('should continue processing when some edits fail', () => {
      const edits = [
        {
          filePath: nonExistentFile,
          findString: 'test',
          replaceString: 'replacement',
        },
        {
          filePath: testFile1,
          findString: 'This is a test file',
          replaceString: 'This is a modified file',
        },
        {
          filePath: testFile1,
          findString: 'Hello', // This will fail due to multiple occurrences
          replaceString: 'Hi',
        },
      ];

      const results = editMultipleFiles(edits);

      expect(results).toHaveLength(3);
      expect(results[0]?.success).toBe(false);
      expect(results[0]?.error).toContain('File not found');
      expect(results[1]?.success).toBe(true);
      expect(results[2]?.success).toBe(false);
      expect(results[2]?.error).toContain('appears 2 times');
    });

    it('should handle empty edits array', () => {
      const results = editMultipleFiles([]);
      expect(results).toHaveLength(0);
    });

    it('should handle mixed success and failure scenarios', () => {
      const edits = [
        {
          filePath: testFile1,
          findString: 'This is a test file',
          replaceString: 'This is a modified file',
        },
        {
          filePath: testFile2,
          findString: 'nonexistent text',
          replaceString: 'replacement',
        },
      ];

      const results = editMultipleFiles(edits);

      expect(results).toHaveLength(2);
      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(false);
      expect(results[1]?.error).toContain('Find string not found');
    });
  });
});
