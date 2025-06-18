import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { editFileTool } from '../../../src/tools/file-tools/edit-file-tool';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

describe('Edit File Tool Unit Tests', () => {
  let tempDir: string;
  let testFile: string;

  beforeEach(() => {
    // Create temporary directory for tests
    tempDir = join(tmpdir(), `edit-file-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    testFile = join(tempDir, 'test.txt');
  });

  afterEach(() => {
    // Clean up temporary directory
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  test('should have correct configuration', () => {
    expect(editFileTool.id).toBe('edit-file');
    expect(editFileTool.description).toBe(
      'Perform exact string replacements in files with occurrence validation'
    );
    expect(editFileTool.inputSchema).toBeDefined();
    expect(editFileTool.outputSchema).toBeDefined();
    expect(editFileTool.execute).toBeDefined();
  });

  test('should validate input schema', () => {
    const validInput = {
      file_path: '/absolute/path/to/file.txt',
      old_string: 'old text',
      new_string: 'new text',
    };
    const result = editFileTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate output schema structure', () => {
    const validOutput = {
      success: true,
      replacements_made: 2,
      file_path: '/path/to/file.txt',
      backup_path: '/path/to/file.txt.backup.2024-01-01T00-00-00-000Z',
      line_changes: [
        {
          line_number: 1,
          old_line: 'old line',
          new_line: 'new line',
        },
      ],
    };

    const result = editFileTool.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should perform simple string replacement', async () => {
    writeFileSync(testFile, 'Hello world\nGoodbye world\nHello again');

    const result = await editFileTool.execute({
      context: {
        file_path: testFile,
        old_string: 'world',
        new_string: 'universe',
        create_backup: false,
      },
    });

    expect(result.success).toBe(true);
    expect(result.replacements_made).toBe(2);
    expect(result.line_changes).toHaveLength(2);
    expect(result.line_changes[0].line_number).toBe(1);
    expect(result.line_changes[0].old_line).toBe('Hello world');
    expect(result.line_changes[0].new_line).toBe('Hello universe');
    expect(result.line_changes[1].line_number).toBe(2);
    expect(result.line_changes[1].old_line).toBe('Goodbye world');
    expect(result.line_changes[1].new_line).toBe('Goodbye universe');

    const updatedContent = readFileSync(testFile, 'utf8');
    expect(updatedContent).toBe('Hello universe\nGoodbye universe\nHello again');
  });

  test('should create backup when enabled', async () => {
    writeFileSync(testFile, 'original content');

    const result = await editFileTool.execute({
      context: {
        file_path: testFile,
        old_string: 'original',
        new_string: 'modified',
        create_backup: true,
      },
    });

    expect(result.success).toBe(true);
    expect(result.backup_path).toBeDefined();
    expect(existsSync(result.backup_path!)).toBe(true);

    const backupContent = readFileSync(result.backup_path!, 'utf8');
    expect(backupContent).toBe('original content');
  });

  test('should validate expected occurrences', async () => {
    writeFileSync(testFile, 'test test test');

    const result = await editFileTool.execute({
      context: {
        file_path: testFile,
        old_string: 'test',
        new_string: 'exam',
        expected_occurrences: 3,
        create_backup: false,
      },
    });

    expect(result.success).toBe(true);
    expect(result.replacements_made).toBe(3);
  });

  test('should fail when expected occurrences mismatch', async () => {
    writeFileSync(testFile, 'test test');

    await expect(
      editFileTool.execute({
        context: {
          file_path: testFile,
          old_string: 'test',
          new_string: 'exam',
          expected_occurrences: 3,
          create_backup: false,
        },
      })
    ).rejects.toThrow('Expected 3 occurrences but found 2');
  });

  test('should fail when string not found', async () => {
    writeFileSync(testFile, 'Hello world');

    await expect(
      editFileTool.execute({
        context: {
          file_path: testFile,
          old_string: 'missing',
          new_string: 'found',
          create_backup: false,
        },
      })
    ).rejects.toThrow('String not found in file: "missing"');
  });

  test('should fail when old_string equals new_string', async () => {
    writeFileSync(testFile, 'Hello world');

    await expect(
      editFileTool.execute({
        context: {
          file_path: testFile,
          old_string: 'same',
          new_string: 'same',
          create_backup: false,
        },
      })
    ).rejects.toThrow('old_string and new_string cannot be the same');
  });

  test('should fail when old_string is empty', async () => {
    writeFileSync(testFile, 'Hello world');

    await expect(
      editFileTool.execute({
        context: {
          file_path: testFile,
          old_string: '',
          new_string: 'something',
          create_backup: false,
        },
      })
    ).rejects.toThrow('old_string cannot be empty');
  });

  test('should handle non-absolute paths', async () => {
    await expect(
      editFileTool.execute({
        context: {
          file_path: 'relative/path.txt',
          old_string: 'old',
          new_string: 'new',
          create_backup: false,
        },
      })
    ).rejects.toThrow('File path must be absolute');
  });

  test('should handle non-existent files', async () => {
    const nonExistentFile = join(tempDir, 'nonexistent.txt');

    await expect(
      editFileTool.execute({
        context: {
          file_path: nonExistentFile,
          old_string: 'old',
          new_string: 'new',
          create_backup: false,
        },
      })
    ).rejects.toThrow(`File not found: ${nonExistentFile}`);
  });

  test('should handle path traversal attempts', async () => {
    await expect(
      editFileTool.execute({
        context: {
          file_path: '/tmp/../etc/passwd',
          old_string: 'old',
          new_string: 'new',
          create_backup: false,
        },
      })
    ).rejects.toThrow('Path traversal not allowed');
  });

  test('should handle access to sensitive directories', async () => {
    await expect(
      editFileTool.execute({
        context: {
          file_path: '/etc/passwd',
          old_string: 'old',
          new_string: 'new',
          create_backup: false,
        },
      })
    ).rejects.toThrow('Access denied to path');
  });

  test('should preserve line endings when enabled', async () => {
    const contentWithCrlf = 'line1\r\nline2\r\nline3';
    writeFileSync(testFile, contentWithCrlf);

    await editFileTool.execute({
      context: {
        file_path: testFile,
        old_string: 'line2',
        new_string: 'modified',
        create_backup: false,
        preserve_line_endings: true,
      },
    });

    const updatedContent = readFileSync(testFile, 'utf8');
    expect(updatedContent).toBe('line1\r\nmodified\r\nline3');
  });

  test('should handle complex replacements with regex characters', async () => {
    writeFileSync(testFile, 'Price: $10.99\nDiscount: $5.00');

    const result = await editFileTool.execute({
      context: {
        file_path: testFile,
        old_string: '$10.99',
        new_string: '$15.99',
        create_backup: false,
      },
    });

    expect(result.success).toBe(true);
    expect(result.replacements_made).toBe(1);

    const updatedContent = readFileSync(testFile, 'utf8');
    expect(updatedContent).toBe('Price: $15.99\nDiscount: $5.00');
  });

  test('should handle multiline replacements', async () => {
    writeFileSync(testFile, 'Line 1\nLine 2\nLine 3\nLine 2 again');

    const result = await editFileTool.execute({
      context: {
        file_path: testFile,
        old_string: 'Line 2',
        new_string: 'Modified Line',
        create_backup: false,
      },
    });

    expect(result.success).toBe(true);
    expect(result.replacements_made).toBe(2);
    expect(result.line_changes).toHaveLength(2);

    const updatedContent = readFileSync(testFile, 'utf8');
    expect(updatedContent).toBe('Line 1\nModified Line\nLine 3\nModified Line again');
  });
});
