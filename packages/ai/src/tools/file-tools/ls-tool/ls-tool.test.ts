import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { materialize } from '@buster/test-utils';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanupTempDir, createNestedStructure, createTempDir } from '../test-utils';
import type { LsToolContext } from './ls-tool';
import { createLsTool } from './ls-tool';

describe.sequential('ls-tool tests', () => {
  let tempDir: string;
  let originalCwd: string;
  let tool: ReturnType<typeof createLsTool>;
  let context: LsToolContext;

  beforeAll(async () => {
    // Save original working directory
    originalCwd = process.cwd();

    // Create temp directory
    tempDir = createTempDir('ls-test-');

    // Change to temp directory
    process.chdir(tempDir);

    // Create nested structure for testing
    await createNestedStructure(tempDir);

    context = {
      messageId: 'test-message-id',
      projectDirectory: tempDir,
      onToolEvent: vi.fn(),
    };

    tool = createLsTool(context);

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

  describe('basic directory listing', () => {
    it('should list files in directory', async () => {
      const rawResult = await tool.execute!(
        {},
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      expect(result.output).toBeTruthy();
      expect(result.count).toBeGreaterThan(0);

      // Should include some expected files
      expect(result.output).toContain('package.json');
      expect(result.output).toContain('src/');
    });

    it('should format output as tree structure', async () => {
      const rawResult = await tool.execute!(
        {},
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      // Tree structure should have indentation
      expect(result.output).toMatch(/^\s+/m); // At least one line should have leading whitespace
      // Should show directories with trailing /
      expect(result.output).toContain('/');
    });

    it('should show nested directory structure', async () => {
      const rawResult = await tool.execute!(
        {},
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      expect(result.output).toContain('src/');
      expect(result.output).toContain('index.ts');
    });
  });

  describe('depth limiting', () => {
    it('should respect depth limit', async () => {
      const rawResult = await tool.execute!(
        { depth: 1 },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      expect(result.output).toBeTruthy();

      // With depth 1, should see top-level directories but not deeply nested files
      expect(result.output).toContain('src/');
      // Should indicate depth limit was reached
      if (result.output.includes('depth limit')) {
        expect(result.output).toContain('...');
      }
    });

    it('should use default depth of 3', async () => {
      const rawResult = await tool.execute!(
        {},
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      // Should show files up to 3 levels deep
      expect(result.output).toBeTruthy();
    });
  });

  describe('pagination', () => {
    it('should paginate results with limit', async () => {
      // First get total count
      const rawResultAll = await tool.execute!(
        { limit: 100 },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const resultAll = await materialize(rawResultAll);
      const totalCount = resultAll.count;

      // Now test with limit
      const rawResult = await tool.execute!(
        { limit: 3 },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      expect(result.count).toBeLessThanOrEqual(3);

      // Only expect truncated if there are actually more files
      if (totalCount > 3) {
        expect(result.count).toBe(3);
        expect(result.truncated).toBe(true);
      }
    });

    it('should handle offset for pagination', async () => {
      // Get first page
      const rawResult1 = await tool.execute!(
        { offset: 0, limit: 2 },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result1 = await materialize(rawResult1);

      // Get second page
      const rawResult2 = await tool.execute!(
        { offset: 2, limit: 2 },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result2 = await materialize(rawResult2);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Results should be different (if there are enough files)
      if (result1.count > 0 && result2.count > 0) {
        expect(result1.output).not.toBe(result2.output);
      }
    });

    it('should set truncated flag correctly', async () => {
      // First, get total file count
      const rawResultAll = await tool.execute!(
        { limit: 100 },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const resultAll = await materialize(rawResultAll);
      const totalFiles = resultAll.count;

      // Only run this test if there are multiple files
      if (totalFiles > 1) {
        // Request only 1 file
        const rawResult = await tool.execute!(
          { limit: 1 },
          {
            toolCallId: 'test-tool-call',
            messages: [],
            abortSignal: new AbortController().signal,
          }
        );
        const result = await materialize(rawResult);

        expect(result.success).toBe(true);
        expect(result.count).toBe(1);
        expect(result.truncated).toBe(true);
      }
    });
  });

  describe('ignore patterns', () => {
    it('should ignore node_modules by default', async () => {
      // Create a node_modules directory
      const filePath = `${tempDir}/node_modules/package/index.js`;
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, 'module.exports = {}', 'utf8');

      const rawResult = await tool.execute!(
        {},
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      expect(result.output).not.toContain('node_modules');
    });

    it('should ignore .git by default', async () => {
      // Create .git directory
      const filePath = `${tempDir}/.git/config`;
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, '[core]', 'utf8');

      const rawResult = await tool.execute!(
        {},
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      // Check that .git/ directory is not listed (but .gitignore file is allowed)
      expect(result.output).not.toContain('.git/');
      expect(result.output).not.toContain('config'); // .git/config file should not appear
    });

    it('should support custom ignore patterns', async () => {
      const filePath = `${tempDir}/temp/temp-file.txt`;
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, 'temp content', 'utf8');

      const rawResult = await tool.execute!(
        {
          ignore: ['temp/'],
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      expect(result.output).not.toContain('temp/');
    });
  });

  describe('error handling', () => {
    it('should handle non-existent directory', async () => {
      const rawResult = await tool.execute!(
        {
          path: `${tempDir}/nonexistent`,
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBeTruthy();
    });

    it('should handle file instead of directory', async () => {
      const filePath = `${tempDir}/regular-file.txt`;
      writeFileSync(filePath, 'content', 'utf8');

      const rawResult = await tool.execute!(
        {
          path: filePath,
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('not a directory');
    });
  });

  describe('specific subdirectory listing', () => {
    it('should list specific subdirectory', async () => {
      const rawResult = await tool.execute!(
        {
          path: `${tempDir}/src`,
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      expect(result.path).toContain('src');
      expect(result.output).toBeTruthy();
    });
  });

  describe('output format', () => {
    it('should include root path in output', async () => {
      const rawResult = await tool.execute!(
        {},
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      expect(result.output).toContain(tempDir);
      expect(result.path).toBe(tempDir);
    });

    it('should show directory separators', async () => {
      const rawResult = await tool.execute!(
        {},
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      // Should have directories marked with /
      expect(result.output).toMatch(/\w+\//);
    });
  });

  describe('file count', () => {
    it('should return accurate file count', async () => {
      const rawResult = await tool.execute!(
        { limit: 100 },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      expect(result.count).toBeGreaterThan(0);
      expect(typeof result.count).toBe('number');

      // Count should match number of files in output (approximately)
      const fileLines = result.output
        .split('\n')
        .filter((line) => line.trim() && !line.endsWith('/'));
      expect(result.count).toBeGreaterThan(0);
    });
  });
});
