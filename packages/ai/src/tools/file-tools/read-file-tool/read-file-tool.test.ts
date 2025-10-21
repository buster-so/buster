import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { materialize } from '@buster/test-utils';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanupTempDir, createTempDir, createTestFile, generateLargeFile } from '../test-utils';
import type { ReadFileToolContext } from './read-file-tool';
import { createReadFileTool } from './read-file-tool';

describe.sequential('read-file-tool integration tests', () => {
  let tempDir: string;
  let originalCwd: string;
  let tool: ReturnType<typeof createReadFileTool>;
  let context: ReadFileToolContext;

  beforeAll(async () => {
    // Save original working directory
    originalCwd = process.cwd();

    // Create temp directory
    tempDir = createTempDir('read-file-test-');

    // Change to temp directory
    process.chdir(tempDir);

    // Create context
    context = {
      messageId: 'test-message-id',
      projectDirectory: tempDir,
      onToolEvent: vi.fn(),
    };

    // Create tool
    tool = createReadFileTool(context);

    // Spy on console to suppress logs during tests
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restore original working directory
    process.chdir(originalCwd);
    cleanupTempDir(tempDir);
    vi.restoreAllMocks();
  });

  describe('basic file reading', () => {
    it('should read small text file', async () => {
      const filePath = join(tempDir, 'small.txt');
      await createTestFile(filePath, 'Hello World\nLine 2\nLine 3');

      const rawResult = await tool.execute!(
        { filePath },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.content).toContain('Hello World');
        expect(result.content).toContain('Line 2');
        expect(result.content).toContain('Line 3');
        expect(result.truncated).toBe(false);
        expect(result.lineTruncated).toBe(false);
        expect(result.charTruncated).toBe(false);
      }
    });

    it('should read TypeScript file', async () => {
      const filePath = join(tempDir, 'code.ts');
      const content = `export const API_KEY = 'test';
export function connect() {
  return db.connect();
}`;
      await createTestFile(filePath, content);

      const rawResult = await tool.execute!(
        { filePath },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.content).toContain('API_KEY');
        expect(result.content).toContain('export function connect');
        expect(result.truncated).toBe(false);
      }
    });

    it('should read JSON file', async () => {
      const filePath = join(tempDir, 'config.json');
      const content = JSON.stringify(
        {
          name: 'test-project',
          version: '1.0.0',
          dependencies: {
            react: '^18.0.0',
          },
        },
        null,
        2
      );
      await createTestFile(filePath, content);

      const rawResult = await tool.execute!(
        { filePath },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.content).toContain('test-project');
        expect(result.content).toContain('dependencies');
        expect(result.truncated).toBe(false);
      }
    });

    it('should read empty file', async () => {
      const filePath = join(tempDir, 'empty.txt');
      await createTestFile(filePath, '');

      const rawResult = await tool.execute!(
        { filePath },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.content).toBe('');
        expect(result.truncated).toBe(false);
      }
    });
  });

  describe('line truncation', () => {
    it('should truncate files exceeding 1000 lines', async () => {
      const filePath = join(tempDir, 'large.txt');
      const content = generateLargeFile(1500);
      await createTestFile(filePath, content);

      const rawResult = await tool.execute!(
        { filePath },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        // Count lines in result
        const lines = result.content.split('\n');
        expect(lines.length).toBeLessThanOrEqual(1000);
        expect(result.truncated).toBe(true);
        expect(result.lineTruncated).toBe(true);
      }
    });

    it('should handle exactly 1000 lines without truncation', async () => {
      const filePath = join(tempDir, 'exactly-1000.txt');
      const content = generateLargeFile(1000);
      await createTestFile(filePath, content);

      const rawResult = await tool.execute!(
        { filePath },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        const lines = result.content.split('\n');
        expect(lines.length).toBe(1000);
        expect(result.lineTruncated).toBe(false);
      }
    });
  });

  describe('character truncation', () => {
    it('should truncate long lines exceeding 2000 characters', async () => {
      const filePath = join(tempDir, 'long-line.txt');
      const longLine = 'x'.repeat(3000);
      await createTestFile(filePath, longLine);

      const rawResult = await tool.execute!(
        { filePath },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.content.length).toBeLessThan(3000);
        expect(result.truncated).toBe(true);
        expect(result.charTruncated).toBe(true);
      }
    });

    it('should handle total content exceeding 100000 characters', async () => {
      const filePath = join(tempDir, 'very-large.txt');
      // Create 1000 lines of 150 characters each = 150,000 chars total
      const content = generateLargeFile(1000, (n) => 'x'.repeat(150));
      await createTestFile(filePath, content);

      const rawResult = await tool.execute!(
        { filePath },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.content.length).toBeLessThan(150000);
        expect(result.truncated).toBe(true);
        expect(result.charTruncated).toBe(true);
      }
    });
  });

  describe('pagination with offset and limit', () => {
    it('should read specific range of lines with offset and limit', async () => {
      const filePath = join(tempDir, 'numbered.txt');
      const content = generateLargeFile(100);
      await createTestFile(filePath, content);

      const rawResult = await tool.execute!(
        {
          filePath,
          offset: 10,
          limit: 5,
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        const lines = result.content.split('\n');
        expect(lines.length).toBeLessThanOrEqual(5);
        // Should start from line 11 (0-indexed offset 10)
        expect(result.content).toContain('Line 11');
      }
    });

    it('should handle offset beyond file length', async () => {
      const filePath = join(tempDir, 'short.txt');
      await createTestFile(filePath, 'Line 1\nLine 2\nLine 3');

      const rawResult = await tool.execute!(
        {
          filePath,
          offset: 100,
          limit: 10,
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.content).toBe('');
      }
    });
  });

  describe('path handling', () => {
    it('should handle relative paths', async () => {
      const filePath = join(tempDir, 'nested/deep/file.txt');
      await createTestFile(filePath, 'Nested content');

      const relativePath = 'nested/deep/file.txt';
      const rawResult = await tool.execute!(
        { filePath: relativePath },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.content).toContain('Nested content');
      }
    });

    it('should handle absolute paths', async () => {
      const filePath = join(tempDir, 'absolute.txt');
      await createTestFile(filePath, 'Absolute path content');

      const rawResult = await tool.execute!(
        { filePath },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.content).toContain('Absolute path content');
      }
    });

    it('should prevent path escape attempts with ../../../', async () => {
      const rawResult = await tool.execute!(
        { filePath: '../../../etc/passwd' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.error_message).toContain('not in the current working directory');
      }
    });

    it('should prevent absolute path escape to system files', async () => {
      const rawResult = await tool.execute!(
        { filePath: '/etc/passwd' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.error_message).toContain('not in the current working directory');
      }
    });
  });

  describe('error handling', () => {
    it('should handle non-existent files', async () => {
      const rawResult = await tool.execute!(
        { filePath: join(tempDir, 'does-not-exist.txt') },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.error_message).toContain('not found');
      }
    });

    it('should handle directory instead of file', async () => {
      const dirPath = join(tempDir, 'test-directory');
      const dummyFile = join(dirPath, 'dummy.txt');
      mkdirSync(dirname(dummyFile), { recursive: true });
      writeFileSync(dummyFile, 'dummy', 'utf8');

      const rawResult = await tool.execute!(
        { filePath: dirPath },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      // Should error or handle gracefully
      expect(result.status).toBe('error');
    });
  });

  describe('special characters and encoding', () => {
    it('should handle Unicode characters', async () => {
      const filePath = join(tempDir, 'unicode.txt');
      const content = 'Hello 世界 🌍 Привет';
      await createTestFile(filePath, content);

      const rawResult = await tool.execute!(
        { filePath },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.content).toBe(content);
      }
    });

    it('should handle newline variations', async () => {
      const filePath = join(tempDir, 'newlines.txt');
      const content = 'Line 1\nLine 2\nLine 3';
      await createTestFile(filePath, content);

      const rawResult = await tool.execute!(
        { filePath },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.content).toContain('Line 1');
        expect(result.content).toContain('Line 2');
        expect(result.content).toContain('Line 3');
      }
    });

    it('should handle files with only newlines', async () => {
      const filePath = join(tempDir, 'only-newlines.txt');
      const content = '\n\n\n';
      await createTestFile(filePath, content);

      const rawResult = await tool.execute!(
        { filePath },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.content).toBe(content);
      }
    });
  });
});
