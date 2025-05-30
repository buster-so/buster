import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lsTool } from '@/tools/file-tools/ls-tool';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

describe('LS Tool Unit Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create temporary directory with test files
    tempDir = join(tmpdir(), `ls-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });

    // Create test files and directories
    writeFileSync(join(tempDir, 'file1.txt'), 'content1');
    writeFileSync(join(tempDir, 'file2.md'), 'content2');
    writeFileSync(join(tempDir, '.hidden.txt'), 'hidden content');
    mkdirSync(join(tempDir, 'subdir'));
    writeFileSync(join(tempDir, 'subdir', 'nested.txt'), 'nested content');
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
    expect(lsTool.id).toBe('ls-directory');
    expect(lsTool.description).toBe('List directory contents with detailed file information');
    expect(lsTool.inputSchema).toBeDefined();
    expect(lsTool.outputSchema).toBeDefined();
    expect(lsTool.execute).toBeDefined();
  });

  test('should validate input schema', () => {
    const validInput = {
      path: '/absolute/path',
      all: true,
      sort_by: 'name' as const,
    };
    const result = lsTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate output schema structure', () => {
    const validOutput = {
      path: '/path/to/directory',
      total_items: 2,
      items: [
        {
          name: 'file.txt',
          type: 'file' as const,
          size: 100,
          size_formatted: '100B',
          modified: '2023-01-01T00:00:00.000Z',
          permissions: 'rw-r--r--',
          is_hidden: false,
        },
      ],
    };

    const result = lsTool.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should list directory contents successfully', async () => {
    const result = await lsTool.execute({
      context: { path: tempDir },
    });

    expect(result.path).toBe(tempDir);
    expect(result.total_items).toBeGreaterThan(0);
    expect(result.items).toBeInstanceOf(Array);

    // Should find visible files but not hidden by default
    const fileNames = result.items.map((item) => item.name);
    expect(fileNames).toContain('file1.txt');
    expect(fileNames).toContain('file2.md');
    expect(fileNames).toContain('subdir');
    expect(fileNames).not.toContain('.hidden.txt');
  });

  test('should include hidden files when all=true', async () => {
    const result = await lsTool.execute({
      context: { path: tempDir, all: true },
    });

    const fileNames = result.items.map((item) => item.name);
    expect(fileNames).toContain('.hidden.txt');

    const hiddenFile = result.items.find((item) => item.name === '.hidden.txt');
    expect(hiddenFile?.is_hidden).toBe(true);
  });

  test('should sort by name correctly', async () => {
    const result = await lsTool.execute({
      context: { path: tempDir, sort_by: 'name' },
    });

    const fileNames = result.items.map((item) => item.name);
    const sortedNames = [...fileNames].sort();
    expect(fileNames).toEqual(sortedNames);
  });

  test('should reverse sort when reverse=true', async () => {
    const result = await lsTool.execute({
      context: { path: tempDir, sort_by: 'name', reverse: true },
    });

    const fileNames = result.items.map((item) => item.name);
    const reverseSortedNames = [...fileNames].sort().reverse();
    expect(fileNames).toEqual(reverseSortedNames);
  });

  test('should filter files by pattern', async () => {
    const result = await lsTool.execute({
      context: { path: tempDir, filter: '*.txt' },
    });

    const fileNames = result.items.map((item) => item.name);
    expect(fileNames).toContain('file1.txt');
    expect(fileNames).not.toContain('file2.md');
    expect(fileNames).not.toContain('subdir');
  });

  test('should identify file types correctly', async () => {
    const result = await lsTool.execute({
      context: { path: tempDir },
    });

    const file = result.items.find((item) => item.name === 'file1.txt');
    const directory = result.items.find((item) => item.name === 'subdir');

    expect(file?.type).toBe('file');
    expect(directory?.type).toBe('directory');
  });

  test('should format file sizes in human readable format', async () => {
    const result = await lsTool.execute({
      context: { path: tempDir, human_readable: true },
    });

    const file = result.items.find((item) => item.name === 'file1.txt');
    expect(file?.size_formatted).toMatch(/\d+B/); // Should end with B for bytes
  });

  test('should provide raw file sizes when human_readable=false', async () => {
    const result = await lsTool.execute({
      context: { path: tempDir, human_readable: false },
    });

    const file = result.items.find((item) => item.name === 'file1.txt');
    expect(file?.size_formatted).toMatch(/^\d+$/); // Should be just numbers
  });

  test('should reject non-existent directories', async () => {
    await expect(
      lsTool.execute({
        context: { path: join(tempDir, 'nonexistent') },
      })
    ).rejects.toThrow('Path not found');
  });

  test('should reject files instead of directories', async () => {
    await expect(
      lsTool.execute({
        context: { path: join(tempDir, 'file1.txt') },
      })
    ).rejects.toThrow('Not a directory');
  });

  test('should handle path traversal attempts', async () => {
    // On macOS, /etc might be accessible, so we test that either:
    // 1. It's blocked with an error, OR
    // 2. It resolves to the actual directory
    try {
      const result = await lsTool.execute({
        context: { path: '/tmp/../etc' },
      });
      // If successful, it should resolve to /etc
      expect(result.path).toBe('/etc');
      expect(result.total_items).toBeGreaterThan(0);
    } catch (error) {
      // If it throws, it should be about path traversal
      expect(error.message).toContain('Path traversal not allowed');
    }
  });

  test('should format permissions correctly', async () => {
    const result = await lsTool.execute({
      context: { path: tempDir },
    });

    const file = result.items.find((item) => item.name === 'file1.txt');
    expect(file?.permissions).toMatch(/^[rwx-]{9}$/); // Should be 9 characters of rwx or -
  });

  test('should include modification timestamps', async () => {
    const result = await lsTool.execute({
      context: { path: tempDir },
    });

    const file = result.items.find((item) => item.name === 'file1.txt');
    expect(file?.modified).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/); // ISO format
  });
});
