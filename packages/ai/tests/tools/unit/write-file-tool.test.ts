import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { writeFileTool } from '../../../src/tools/file-tools/write-file-tool';

describe('Write File Tool Unit Tests', () => {
  let tempDir: string;
  let testFile: string;
  let existingFile: string;

  beforeEach(() => {
    // Create temporary directory for tests
    tempDir = join(tmpdir(), `write-file-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    testFile = join(tempDir, 'test.txt');
    existingFile = join(tempDir, 'existing.txt');

    // Create an existing file
    writeFileSync(existingFile, 'Original content');
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
    expect(writeFileTool.id).toBe('write-file');
    expect(writeFileTool.description).toBe(
      'Write content to a file with atomic operations and safety checks'
    );
    expect(writeFileTool.inputSchema).toBeDefined();
    expect(writeFileTool.outputSchema).toBeDefined();
    expect(writeFileTool.execute).toBeDefined();
  });

  test('should validate input schema', () => {
    const validInput = {
      file_path: '/absolute/path/to/file.txt',
      content: 'Hello, world!',
      overwrite: true,
    };
    const result = writeFileTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate output schema structure', () => {
    const validOutput = {
      success: true,
      file_path: '/path/to/file.txt',
      bytes_written: 100,
      backup_path: '/path/to/file.txt.backup.2023-01-01T00-00-00-000Z',
      created_directories: ['/path', '/path/to'],
    };

    const result = writeFileTool.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should write new file successfully', async () => {
    const content = 'Hello, world!';
    const result = await writeFileTool.execute({
      context: {
        file_path: testFile,
        content,
        overwrite: false,
      },
    });

    expect(result.success).toBe(true);
    expect(result.file_path).toBe(testFile);
    expect(result.bytes_written).toBeGreaterThan(0);
    expect(result.backup_path).toBeUndefined();
    expect(existsSync(testFile)).toBe(true);
    expect(readFileSync(testFile, 'utf-8')).toBe(content);
  });

  test('should overwrite existing file with backup', async () => {
    const newContent = 'New content';
    const result = await writeFileTool.execute({
      context: {
        file_path: existingFile,
        content: newContent,
        overwrite: true,
        create_backup: true,
      },
    });

    expect(result.success).toBe(true);
    expect(result.backup_path).toBeDefined();
    if (result.backup_path) {
      expect(existsSync(result.backup_path)).toBe(true);
      expect(readFileSync(result.backup_path, 'utf-8')).toBe('Original content');
    }
    expect(readFileSync(existingFile, 'utf-8')).toBe(newContent);
  });

  test('should create directories if they do not exist', async () => {
    const nestedFile = join(tempDir, 'nested', 'deep', 'file.txt');
    const result = await writeFileTool.execute({
      context: {
        file_path: nestedFile,
        content: 'Nested content',
        overwrite: false,
        create_backup: true,
        encoding: 'utf8',
      },
    });

    expect(result.success).toBe(true);
    expect(result.created_directories.length).toBeGreaterThan(0);
    expect(existsSync(nestedFile)).toBe(true);
    expect(readFileSync(nestedFile, 'utf-8')).toBe('Nested content');
  });

  test('should reject overwrite when overwrite=false and file exists', async () => {
    await expect(
      writeFileTool.execute({
        context: {
          file_path: existingFile,
          content: 'New content',
          overwrite: false,
        },
      })
    ).rejects.toThrow('File already exists');
  });

  test('should reject non-absolute paths', async () => {
    await expect(
      writeFileTool.execute({
        context: {
          file_path: 'relative/path.txt',
          content: 'content',
        },
      })
    ).rejects.toThrow('File path must be absolute');
  });

  test('should reject path traversal attempts', async () => {
    await expect(
      writeFileTool.execute({
        context: {
          file_path: '/tmp/../etc/passwd',
          content: 'malicious content',
          overwrite: false,
          create_backup: true,
          encoding: 'utf8',
        },
      })
    ).rejects.toThrow(/Write access denied to system directory|Path traversal not allowed/);
  });

  test('should reject writes to system directories', async () => {
    await expect(
      writeFileTool.execute({
        context: {
          file_path: '/etc/malicious.txt',
          content: 'malicious content',
          overwrite: false,
          create_backup: true,
          encoding: 'utf8',
        },
      })
    ).rejects.toThrow('Write access denied to system directory');
  });

  test('should support different encodings', async () => {
    const content = 'ASCII content';
    const result = await writeFileTool.execute({
      context: {
        file_path: testFile,
        content,
        overwrite: false,
        create_backup: true,
        encoding: 'ascii',
      },
    });

    expect(result.success).toBe(true);
    expect(readFileSync(testFile, 'ascii')).toBe(content);
  });

  test('should handle write without backup when file exists', async () => {
    const newContent = 'No backup content';
    const result = await writeFileTool.execute({
      context: {
        file_path: existingFile,
        content: newContent,
        overwrite: true,
        create_backup: false,
      },
    });

    expect(result.success).toBe(true);
    expect(result.backup_path).toBeUndefined();
    expect(readFileSync(existingFile, 'utf-8')).toBe(newContent);
  });
});
