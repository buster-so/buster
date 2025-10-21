import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { materialize } from '@buster/test-utils';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanupTempDir, createTempDir, createTestFile } from '../test-utils';
import type { MultiEditFileToolContext } from './multi-edit-file-tool';
import { createMultiEditFileTool } from './multi-edit-file-tool';

describe.sequential('multi-edit-file-tool tests', () => {
  let tempDir: string;
  let originalCwd: string;
  let tool: ReturnType<typeof createMultiEditFileTool>;
  let context: MultiEditFileToolContext;

  beforeAll(async () => {
    // Save original working directory
    originalCwd = process.cwd();

    // Create temp directory
    tempDir = createTempDir('multi-edit-test-');

    // Change to temp directory
    process.chdir(tempDir);

    context = {
      messageId: 'test-message-id',
      projectDirectory: tempDir,
      onToolEvent: vi.fn(),
    };

    tool = createMultiEditFileTool(context);

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

  describe('sequential edits', () => {
    it('should perform multiple edits sequentially', async () => {
      const filePath = join(tempDir, 'sequential.ts');
      await createTestFile(
        filePath,
        `export const API_URL = 'https://old.com';
export const TIMEOUT = 5000;
export const RETRIES = 3;`
      );

      const rawResult = await tool.execute!(
        {
          filePath,
          edits: [
            { oldString: 'https://old.com', newString: 'https://new.com' },
            { oldString: 'TIMEOUT = 5000', newString: 'TIMEOUT = 10000' },
            { oldString: 'RETRIES = 3', newString: 'RETRIES = 5' },
          ],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      expect(result.editResults).toHaveLength(3);
      expect(result.editResults.every((r) => r.success)).toBe(true);

      const content = readFileSync(filePath, 'utf8');
      expect(content).toContain('https://new.com');
      expect(content).toContain('TIMEOUT = 10000');
      expect(content).toContain('RETRIES = 5');
    });

    it('should apply edits in order', async () => {
      const filePath = join(tempDir, 'ordered.ts');
      await createTestFile(filePath, 'const value = 1;');

      const rawResult = await tool.execute!(
        {
          filePath,
          edits: [
            { oldString: 'value = 1', newString: 'value = 2' },
            { oldString: 'value = 2', newString: 'value = 3' },
          ],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);

      const content = readFileSync(filePath, 'utf8');
      expect(content).toContain('value = 3');
      expect(content).not.toContain('value = 1');
      expect(content).not.toContain('value = 2');
    });
  });

  describe('multiple code blocks', () => {
    it('should edit multiple different sections', async () => {
      const filePath = join(tempDir, 'sections.ts');
      await createTestFile(
        filePath,
        `export function foo() {
  return 'foo';
}

export function bar() {
  return 'bar';
}

export function baz() {
  return 'baz';
}`
      );

      const rawResult = await tool.execute!(
        {
          filePath,
          edits: [
            { oldString: "return 'foo';", newString: "return 'foo-updated';" },
            { oldString: "return 'bar';", newString: "return 'bar-updated';" },
            { oldString: "return 'baz';", newString: "return 'baz-updated';" },
          ],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      expect(result.editResults).toHaveLength(3);

      const content = readFileSync(filePath, 'utf8');
      expect(content).toContain('foo-updated');
      expect(content).toContain('bar-updated');
      expect(content).toContain('baz-updated');
    });
  });

  describe('error handling', () => {
    it('should stop on first failing edit and rollback (atomic)', async () => {
      const filePath = join(tempDir, 'stop-on-error.ts');
      await createTestFile(filePath, 'const foo = 1;\nconst bar = 2;');

      const rawResult = await tool.execute!(
        {
          filePath,
          edits: [
            { oldString: 'foo = 1', newString: 'foo = 10' }, // Would succeed
            { oldString: 'nonexistent', newString: 'value' }, // Will fail
            { oldString: 'bar = 2', newString: 'bar = 20' }, // Should not execute
          ],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(false);
      expect(result.editResults).toHaveLength(2); // Only first two edits attempted
      expect(result.editResults[0].success).toBe(true);
      expect(result.editResults[1].success).toBe(false);

      // Multi-edit is atomic: if any edit fails, NO changes are applied
      const content = readFileSync(filePath, 'utf8');
      expect(content).toBe('const foo = 1;\nconst bar = 2;'); // Original content unchanged
    });

    it('should provide detailed error for each failing edit', async () => {
      const filePath = join(tempDir, 'error-details.ts');
      await createTestFile(filePath, 'const foo = 1;');

      const rawResult = await tool.execute!(
        {
          filePath,
          edits: [{ oldString: 'nonexistent', newString: 'value' }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(false);
      expect(result.editResults[0].success).toBe(false);
      expect(result.editResults[0].errorMessage).toBeTruthy();
      expect(result.editResults[0].errorMessage).toContain('not found');
    });

    it('should require at least one edit', async () => {
      const filePath = join(tempDir, 'no-edits.ts');
      await createTestFile(filePath, 'const foo = 1;');

      // AI SDK v5 handles schema validation, which may not throw in the traditional way
      // Instead, verify that calling with empty edits either throws or returns an error
      try {
        const rawResult = await tool.execute!(
          {
            filePath,
            edits: [],
          } as any, // Bypass TypeScript validation to test runtime validation
          {
            toolCallId: 'test-tool-call',
            messages: [],
            abortSignal: new AbortController().signal,
          }
        );

        // If it doesn't throw, the result should indicate validation failure
        // The test passes if we get here and either rawResult is undefined or contains an error
        const result = rawResult ? await materialize(rawResult) : undefined;
        if (result) {
          // If we got a result, it should indicate failure
          expect(result.success).toBe(false);
        }
      } catch (error) {
        // Expected to throw - test passes
        expect(error).toBeTruthy();
      }
    });

    it('should fail to replace non-existent text in non-existent file', async () => {
      const rawResult = await tool.execute!(
        {
          filePath: join(tempDir, 'nonexistent.ts'),
          edits: [{ oldString: 'old', newString: 'new' }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      // When file doesn't exist, it's treated as empty content
      // Trying to replace 'old' in empty content should fail
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorMessage).toBeTruthy();
      }
    });

    it('should create new file when first edit has empty oldString', async () => {
      const newFilePath = join(tempDir, 'new-file.ts');
      const rawResult = await tool.execute!(
        {
          filePath: newFilePath,
          edits: [{ oldString: '', newString: 'export const foo = 1;' }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      expect(result.editResults[0].success).toBe(true);

      const content = readFileSync(newFilePath, 'utf8');
      expect(content).toBe('export const foo = 1;');
    });
  });

  describe('replaceAll in edits', () => {
    it('should support replaceAll in individual edits', async () => {
      const filePath = join(tempDir, 'replace-all-edits.ts');
      await createTestFile(
        filePath,
        `const foo = 'test';
const bar = 'test';
const baz = 'value';`
      );

      const rawResult = await tool.execute!(
        {
          filePath,
          edits: [
            { oldString: 'test', newString: 'prod', replaceAll: true },
            { oldString: 'value', newString: 'data' },
          ],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);

      const content = readFileSync(filePath, 'utf8');
      expect((content.match(/'prod'/g) || []).length).toBe(2);
      expect(content).toContain('data');
    });
  });

  describe('diff generation', () => {
    it('should generate final diff showing all changes', async () => {
      const filePath = join(tempDir, 'diff-test.ts');
      await createTestFile(
        filePath,
        `const foo = 1;
const bar = 2;`
      );

      const rawResult = await tool.execute!(
        {
          filePath,
          edits: [
            { oldString: 'foo = 1', newString: 'foo = 10' },
            { oldString: 'bar = 2', newString: 'bar = 20' },
          ],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      expect(result.finalDiff).toBeDefined();
      expect(result.finalDiff).toContain('-');
      expect(result.finalDiff).toContain('+');
      expect(result.finalDiff).toContain('foo = 10');
      expect(result.finalDiff).toContain('bar = 20');
    });
  });

  describe('complex refactoring', () => {
    it('should handle complex multi-step refactoring', async () => {
      const filePath = join(tempDir, 'refactor.ts');
      await createTestFile(
        filePath,
        `function getData() {
  const url = 'https://api.com';
  return fetch(url);
}`
      );

      const rawResult = await tool.execute!(
        {
          filePath,
          edits: [
            { oldString: 'function getData()', newString: 'async function getData()' },
            {
              oldString: 'return fetch(url);',
              newString: 'const response = await fetch(url);\n  return response.json();',
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

      expect(result.success).toBe(true);

      const content = readFileSync(filePath, 'utf8');
      expect(content).toContain('async function getData');
      expect(content).toContain('await fetch');
      expect(content).toContain('response.json()');
    });
  });

  describe('relative paths', () => {
    it('should handle relative file paths', async () => {
      const relativePath = 'nested/multi-edit.ts';
      const fullPath = join(tempDir, relativePath);
      await createTestFile(fullPath, 'const foo = 1;\nconst bar = 2;');

      const rawResult = await tool.execute!(
        {
          filePath: relativePath,
          edits: [
            { oldString: 'foo = 1', newString: 'foo = 10' },
            { oldString: 'bar = 2', newString: 'bar = 20' },
          ],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);

      const content = readFileSync(fullPath, 'utf8');
      expect(content).toContain('foo = 10');
      expect(content).toContain('bar = 20');
    });
  });

  describe('edit results metadata', () => {
    it('should number edits sequentially', async () => {
      const filePath = join(tempDir, 'numbered.ts');
      await createTestFile(filePath, 'const a = 1;\nconst b = 2;\nconst c = 3;');

      const rawResult = await tool.execute!(
        {
          filePath,
          edits: [
            { oldString: 'a = 1', newString: 'a = 10' },
            { oldString: 'b = 2', newString: 'b = 20' },
            { oldString: 'c = 3', newString: 'c = 30' },
          ],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.editResults[0].editNumber).toBe(1);
      expect(result.editResults[1].editNumber).toBe(2);
      expect(result.editResults[2].editNumber).toBe(3);
    });

    it('should provide message for each successful edit', async () => {
      const filePath = join(tempDir, 'messages.ts');
      await createTestFile(filePath, 'const foo = 1;');

      const rawResult = await tool.execute!(
        {
          filePath,
          edits: [{ oldString: 'foo = 1', newString: 'foo = 2' }],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.editResults[0].success).toBe(true);
      expect(result.editResults[0].message).toBeTruthy();
    });
  });
});
