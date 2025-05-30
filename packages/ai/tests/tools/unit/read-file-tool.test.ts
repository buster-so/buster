import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileTool } from '@/tools/file-tools/read-file-tool';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

describe('Read File Tool Unit Tests', () => {
  let tempDir: string;
  let testFile: string;
  let multiTestFile: string;

  beforeEach(() => {
    // Create temporary directory for tests
    tempDir = join(tmpdir(), `read-file-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    testFile = join(tempDir, 'test.txt');
    multiTestFile = join(tempDir, 'multi.txt');

    // Create test files
    writeFileSync(testFile, 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5');
    writeFileSync(multiTestFile, 'Multi line 1\nMulti line 2\nMulti line 3');
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
    expect(readFileTool.id).toBe('read-file');
    expect(readFileTool.description).toBe(
      'Reads files from the local filesystem with optional line offset and limit'
    );
    expect(readFileTool.inputSchema).toBeDefined();
    expect(readFileTool.outputSchema).toBeDefined();
    expect(readFileTool.execute).toBeDefined();
  });

  test('should validate single file input schema', () => {
    const validInput = { file_path: '/absolute/path/to/file.txt' };
    const result = readFileTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate multiple files input schema', () => {
    const validInput = {
      file_paths: ['/absolute/path/to/file1.txt', '/absolute/path/to/file2.txt'],
    };
    const result = readFileTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate output schema structure', () => {
    const validOutput = {
      content: 'file content',
      files_read: 1,
      total_lines: 10,
      truncated: false,
    };

    const result = readFileTool.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should read single file successfully', async () => {
    const result = await readFileTool.execute({
      context: { file_path: testFile },
    });

    expect(result.files_read).toBe(1);
    expect(result.content).toContain('Line 1');
    expect(result.content).toContain('Line 5');
    expect(result.truncated).toBe(false);
  });

  test('should read multiple files successfully', async () => {
    const result = await readFileTool.execute({
      context: { file_paths: [testFile, multiTestFile] },
    });

    expect(result.files_read).toBe(2);
    expect(result.content).toContain('==> ' + testFile + ' <==');
    expect(result.content).toContain('==> ' + multiTestFile + ' <==');
    expect(result.content).toContain('Line 1');
    expect(result.content).toContain('Multi line 1');
  });

  test('should apply offset and limit correctly', async () => {
    const result = await readFileTool.execute({
      context: { file_path: testFile, offset: 1, limit: 2 },
    });

    expect(result.content).toContain('     2 Line 2');
    expect(result.content).toContain('     3 Line 3');
    expect(result.content).not.toContain('Line 1');
    expect(result.content).not.toContain('Line 4');
    expect(result.truncated).toBe(true);
  });

  test('should handle non-absolute paths with error message', async () => {
    const result = await readFileTool.execute({
      context: { file_path: 'relative/path.txt' },
    });

    expect(result.content).toContain('Error reading relative/path.txt');
    expect(result.content).toContain('File path must be absolute');
  });

  test('should handle non-existent files with error message', async () => {
    const nonExistentFile = join(tempDir, 'nonexistent.txt');
    const result = await readFileTool.execute({
      context: { file_path: nonExistentFile },
    });

    expect(result.content).toContain('Error reading');
    expect(result.content).toContain('File does not exist');
  });

  test('should handle path traversal attempts with error message', async () => {
    const result = await readFileTool.execute({
      context: { file_path: '/tmp/../etc/passwd' },
    });

    expect(result.content).toContain('Error reading');
    expect(result.content).toContain('Access denied to path');
  });

  test('should handle access to sensitive directories with error message', async () => {
    const result = await readFileTool.execute({
      context: { file_path: '/etc/passwd' },
    });

    expect(result.content).toContain('Error reading');
    expect(result.content).toContain('Access denied to path');
  });

  test('should handle missing file_path and file_paths', async () => {
    await expect(
      readFileTool.execute({
        context: {},
      })
    ).rejects.toThrow('Must provide either file_path or file_paths');
  });

  test('should format line numbers correctly', async () => {
    const result = await readFileTool.execute({
      context: { file_path: testFile },
    });

    expect(result.content).toMatch(/\s+1 Line 1/);
    expect(result.content).toMatch(/\s+2 Line 2/);
    expect(result.content).toMatch(/\s+5 Line 5/);
  });
});
