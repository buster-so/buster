import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { materialize } from '@buster/test-utils';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanupTempDir, createTempDir } from '../test-utils';
import type { WriteFileToolContext } from './write-file-tool';
import { createWriteFileTool } from './write-file-tool';

describe.sequential('write-file-tool integration tests', () => {
  let tempDir: string;
  let originalCwd: string;
  let tool: ReturnType<typeof createWriteFileTool>;
  let context: WriteFileToolContext;

  beforeAll(async () => {
    // Save original working directory
    originalCwd = process.cwd();

    // Create temp directory
    tempDir = createTempDir('write-file-test-');

    // Change to temp directory
    process.chdir(tempDir);

    // Create context
    context = {
      messageId: 'test-message-id',
      projectDirectory: tempDir,
      onToolEvent: vi.fn(),
    };

    // Create tool
    tool = createWriteFileTool(context);

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

  describe('single file creation', () => {
    it('should create new file with content', async () => {
      const filePath = join(tempDir, 'new-file.txt');

      const rawResult = await tool.execute!(
        {
          files: [{ path: filePath, content: 'Hello World' }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].status).toBe('success');
      expect(result.results[0].filePath).toBe(filePath);

      // Verify file exists and has correct content
      expect(existsSync(filePath)).toBe(true);
      const fileContent = readFileSync(filePath, 'utf8');
      expect(fileContent).toBe('Hello World');
    });

    it('should create TypeScript file', async () => {
      const filePath = join(tempDir, 'module.ts');
      const content = `export const API_KEY = 'test';
export function connect() {
  return db.connect();
}`;

      const rawResult = await tool.execute!(
        {
          files: [{ path: filePath, content }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('success');

      const fileContent = readFileSync(filePath, 'utf8');
      expect(fileContent).toBe(content);
    });

    it('should create JSON file', async () => {
      const filePath = join(tempDir, 'config.json');
      const content = JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2);

      const rawResult = await tool.execute!(
        {
          files: [{ path: filePath, content }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('success');

      const fileContent = readFileSync(filePath, 'utf8');
      expect(JSON.parse(fileContent)).toEqual({ name: 'test', version: '1.0.0' });
    });
  });

  describe('file overwriting', () => {
    it('should overwrite existing file', async () => {
      const filePath = join(tempDir, 'existing.txt');

      // Create initial file
      writeFileSync(filePath, 'Original Content', 'utf8');

      // Overwrite with new content
      const rawResult = await tool.execute!(
        {
          files: [{ path: filePath, content: 'New Content' }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('success');

      const fileContent = readFileSync(filePath, 'utf8');
      expect(fileContent).toBe('New Content');
      expect(fileContent).not.toContain('Original Content');
    });

    it('should completely replace file content', async () => {
      const filePath = join(tempDir, 'replace.txt');

      // Create initial file with multi-line content
      writeFileSync(filePath, 'Line 1\nLine 2\nLine 3', 'utf8');

      // Replace with single line
      const rawResult = await tool.execute!(
        {
          files: [{ path: filePath, content: 'Single line' }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('success');

      const fileContent = readFileSync(filePath, 'utf8');
      expect(fileContent).toBe('Single line');
    });
  });

  describe('batch file creation', () => {
    it('should create multiple files in parallel', async () => {
      const files = [
        { path: join(tempDir, 'file1.txt'), content: 'Content 1' },
        { path: join(tempDir, 'file2.txt'), content: 'Content 2' },
        { path: join(tempDir, 'file3.txt'), content: 'Content 3' },
      ];

      const rawResult = await tool.execute!(
        { files },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results).toHaveLength(3);
      expect(result.results.every((r) => r.status === 'success')).toBe(true);

      // Verify all files exist with correct content
      for (const file of files) {
        expect(existsSync(file.path)).toBe(true);
        const content = readFileSync(file.path, 'utf8');
        expect(content).toBe(file.content);
      }
    });

    it('should create files in different directories', async () => {
      const files = [
        { path: join(tempDir, 'dir1/file.txt'), content: 'File in dir1' },
        { path: join(tempDir, 'dir2/file.txt'), content: 'File in dir2' },
        { path: join(tempDir, 'dir3/nested/file.txt'), content: 'File in nested dir' },
      ];

      const rawResult = await tool.execute!(
        { files },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results).toHaveLength(3);
      expect(result.results.every((r) => r.status === 'success')).toBe(true);

      // Verify all files exist
      for (const file of files) {
        expect(existsSync(file.path)).toBe(true);
        const content = readFileSync(file.path, 'utf8');
        expect(content).toBe(file.content);
      }
    });
  });

  describe('nested directory creation', () => {
    it('should create nested directories automatically', async () => {
      const filePath = join(tempDir, 'deep/nested/path/file.txt');

      const rawResult = await tool.execute!(
        {
          files: [{ path: filePath, content: 'Nested content' }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('success');

      expect(existsSync(filePath)).toBe(true);
      const content = readFileSync(filePath, 'utf8');
      expect(content).toBe('Nested content');
    });

    it('should handle multiple levels of nesting', async () => {
      const filePath = join(tempDir, 'a/b/c/d/e/file.txt');

      const rawResult = await tool.execute!(
        {
          files: [{ path: filePath, content: 'Deep nesting' }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('success');
      expect(existsSync(filePath)).toBe(true);
    });
  });

  describe('path handling', () => {
    it('should handle relative paths', async () => {
      const relativePath = 'relative/path/file.txt';

      const rawResult = await tool.execute!(
        {
          files: [{ path: relativePath, content: 'Relative content' }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('success');

      const fullPath = join(tempDir, relativePath);
      expect(existsSync(fullPath)).toBe(true);
    });

    it('should handle absolute paths within project', async () => {
      const absolutePath = join(tempDir, 'absolute-file.txt');

      const rawResult = await tool.execute!(
        {
          files: [{ path: absolutePath, content: 'Absolute content' }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('success');
      expect(existsSync(absolutePath)).toBe(true);
    });

    it('should prevent path escape with ../../../', async () => {
      const rawResult = await tool.execute!(
        {
          files: [{ path: '../../../tmp/malicious.txt', content: 'Bad content' }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('error');
      if (result.results[0].status === 'error') {
        expect(result.results[0].errorMessage).toContain('not in the current working directory');
      }
    });

    it('should prevent absolute path escape to system directories', async () => {
      const rawResult = await tool.execute!(
        {
          files: [{ path: '/etc/malicious.txt', content: 'Bad content' }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('error');
      if (result.results[0].status === 'error') {
        expect(result.results[0].errorMessage).toContain('not in the current working directory');
      }
    });
  });

  describe('content variations', () => {
    it('should handle empty content', async () => {
      const filePath = join(tempDir, 'empty.txt');

      const rawResult = await tool.execute!(
        {
          files: [{ path: filePath, content: '' }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('success');
      expect(existsSync(filePath)).toBe(true);
      const content = readFileSync(filePath, 'utf8');
      expect(content).toBe('');
    });

    it('should handle Unicode characters', async () => {
      const filePath = join(tempDir, 'unicode.txt');
      const content = 'Hello 世界 🌍 Привет';

      const rawResult = await tool.execute!(
        {
          files: [{ path: filePath, content }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('success');
      const fileContent = readFileSync(filePath, 'utf8');
      expect(fileContent).toBe(content);
    });

    it('should handle multiline content', async () => {
      const filePath = join(tempDir, 'multiline.txt');
      const content = `Line 1
Line 2
Line 3
Line 4`;

      const rawResult = await tool.execute!(
        {
          files: [{ path: filePath, content }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('success');
      const fileContent = readFileSync(filePath, 'utf8');
      expect(fileContent).toBe(content);
    });

    it('should handle large content', async () => {
      const filePath = join(tempDir, 'large.txt');
      const content = 'x'.repeat(100000);

      const rawResult = await tool.execute!(
        {
          files: [{ path: filePath, content }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('success');
      const fileContent = readFileSync(filePath, 'utf8');
      expect(fileContent.length).toBe(100000);
    });
  });

  describe('error handling with partial success', () => {
    it('should continue processing other files when one fails', async () => {
      const files = [
        { path: join(tempDir, 'success1.txt'), content: 'Success 1' },
        { path: '/etc/fail.txt', content: 'This should fail' }, // Path escape
        { path: join(tempDir, 'success2.txt'), content: 'Success 2' },
      ];

      const rawResult = await tool.execute!(
        { files },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results).toHaveLength(3);

      // First file should succeed
      expect(result.results[0].status).toBe('success');
      expect(existsSync(files[0].path)).toBe(true);

      // Second file should fail
      expect(result.results[1].status).toBe('error');

      // Third file should still succeed despite second failing
      expect(result.results[2].status).toBe('success');
      expect(existsSync(files[2].path)).toBe(true);
    });

    it('should provide detailed error messages', async () => {
      const rawResult = await tool.execute!(
        {
          files: [{ path: '../../../etc/passwd', content: 'Bad' }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('error');
      if (result.results[0].status === 'error') {
        expect(result.results[0].errorMessage).toBeTruthy();
        expect(result.results[0].errorMessage.length).toBeGreaterThan(0);
      }
    });
  });

  describe('invalid path validation', () => {
    it('should reject paths with newline characters', async () => {
      const rawResult = await tool.execute!(
        {
          files: [{ path: 'file\nwith\nnewlines.txt', content: 'Content' }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('error');
      if (result.results[0].status === 'error') {
        expect(result.results[0].errorMessage).toContain('newline');
      }
    });

    it('should reject paths with carriage return characters', async () => {
      const rawResult = await tool.execute!(
        {
          files: [{ path: 'file\rwith\rreturns.txt', content: 'Content' }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('error');
      if (result.results[0].status === 'error') {
        expect(result.results[0].errorMessage).toContain('newline');
      }
    });

    it('should reject paths containing "Working Directory:" context', async () => {
      const rawResult = await tool.execute!(
        {
          files: [
            {
              path: 'Working Directory: /some/path\n\nfile.txt',
              content: 'Content',
            },
          ],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('error');
      if (result.results[0].status === 'error') {
        // Should reject with either newline or context information error
        expect(result.results[0].errorMessage).toMatch(/newline|context information/);
      }
    });

    it('should reject paths containing "Directory Structure:" context', async () => {
      const rawResult = await tool.execute!(
        {
          files: [
            {
              path: 'Directory Structure:\n```\nproject/\n```\nfile.txt',
              content: 'Content',
            },
          ],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('error');
      if (result.results[0].status === 'error') {
        // Should reject with either newline or context information error
        expect(result.results[0].errorMessage).toMatch(/newline|context information/);
      }
    });

    it('should reject the exact problematic path from the bug report', async () => {
      const problematicPath = `Working Directory: /Users/dallin/buster/adventure-works

Directory Structure:
\`\`\`
adventure-works/
├── adventure_works/
├── buster/
\`\`\`/hello world`;

      const rawResult = await tool.execute!(
        {
          files: [{ path: problematicPath, content: 'Hello, World!' }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.results[0].status).toBe('error');
      if (result.results[0].status === 'error') {
        expect(result.results[0].errorMessage).toMatch(/newline|context information/);
      }
    });
  });
});
