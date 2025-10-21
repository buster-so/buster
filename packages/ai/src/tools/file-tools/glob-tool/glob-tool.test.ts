import { join } from 'node:path';
import { materialize } from '@buster/test-utils';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  cleanupTempDir,
  createNestedStructure,
  createTempDir,
  createTestFile,
  setFileModificationTime,
} from '../test-utils';
import type { GlobToolContext } from './glob-tool';
import { createGlobTool } from './glob-tool';

describe.sequential('glob-tool integration tests', () => {
  let tempDir: string;
  let originalCwd: string;
  let tool: ReturnType<typeof createGlobTool>;
  let context: GlobToolContext;

  beforeAll(async () => {
    // Save original working directory
    originalCwd = process.cwd();

    // Create temp directory
    tempDir = createTempDir('glob-test-');

    // Change to temp directory
    process.chdir(tempDir);

    // Create nested structure
    await createNestedStructure(tempDir);

    // Create context
    context = {
      messageId: 'test-message-id',
      projectDirectory: tempDir,
      onToolEvent: vi.fn(),
    };

    // Create tool
    tool = createGlobTool(context);

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

  describe('pattern matching', () => {
    it('should find all TypeScript files with **/*.ts pattern', async () => {
      const rawResult = await tool.execute!(
        { pattern: '**/*.ts' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.pattern).toBe('**/*.ts');
      expect(result.matches.length).toBeGreaterThan(0);

      // Should find TypeScript files
      const paths = result.matches.map((m) => m.path);
      expect(paths.some((p) => p.includes('index.ts'))).toBe(true);
      expect(paths.some((p) => p.includes('helpers.ts'))).toBe(true);
      expect(paths.some((p) => p.includes('types.ts'))).toBe(true);

      // Should not find non-TypeScript files
      expect(paths.some((p) => p.endsWith('.md'))).toBe(false);
      expect(paths.some((p) => p.endsWith('.json'))).toBe(false);
    });

    it('should find TypeScript test files with **/*.test.ts pattern', async () => {
      const rawResult = await tool.execute!(
        { pattern: '**/*.test.ts' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches.length).toBeGreaterThan(0);

      const paths = result.matches.map((m) => m.path);
      expect(paths.some((p) => p.includes('helpers.test.ts'))).toBe(true);
    });

    it('should find integration test files with **/*.int.test.ts pattern', async () => {
      const rawResult = await tool.execute!(
        { pattern: '**/*.int.test.ts' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches.length).toBeGreaterThan(0);

      const paths = result.matches.map((m) => m.path);
      expect(paths.some((p) => p.includes('api.int.test.ts'))).toBe(true);
    });

    it('should respect directory boundaries with src/**/*.ts pattern', async () => {
      const rawResult = await tool.execute!(
        { pattern: 'src/**/*.ts' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      const paths = result.matches.map((m) => m.path);

      // Should find files in src/
      expect(paths.some((p) => p.includes('src/index.ts'))).toBe(true);
      expect(paths.some((p) => p.includes('src/utils/helpers.ts'))).toBe(true);

      // Should not find files outside src/
      expect(paths.some((p) => p.includes('tests/'))).toBe(false);
      expect(paths.some((p) => p.includes('docs/'))).toBe(false);
    });

    it('should handle alternation patterns *.{ts,tsx}', async () => {
      const rawResult = await tool.execute!(
        { pattern: '**/*.{ts,tsx}' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      const paths = result.matches.map((m) => m.path);

      // Should find both .ts and .tsx files
      expect(paths.some((p) => p.endsWith('.ts'))).toBe(true);
      expect(paths.some((p) => p.endsWith('.tsx'))).toBe(true);
      expect(paths.some((p) => p.includes('Button.tsx'))).toBe(true);
    });

    it('should find markdown files with *.md pattern', async () => {
      const rawResult = await tool.execute!(
        { pattern: '**/*.md' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      const paths = result.matches.map((m) => m.path);

      expect(paths.some((p) => p.includes('README.md'))).toBe(true);
      expect(paths.some((p) => p.includes('getting-started.md'))).toBe(true);
    });

    it('should search in specific subdirectory when path is provided', async () => {
      const rawResult = await tool.execute!(
        {
          pattern: '*.md',
          path: 'docs',
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      const paths = result.matches.map((m) => m.path);

      // Should only find files in docs/ directory
      expect(paths.every((p) => p.includes('docs'))).toBe(true);
    });
  });

  describe('pagination', () => {
    it('should paginate large result sets with limit', async () => {
      const rawResult = await tool.execute!(
        {
          pattern: '**/*',
          limit: 3,
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches.length).toBe(3);
      expect(result.truncated).toBe(true);
    });

    it('should handle offset and limit for pagination', async () => {
      // Get first page
      const rawResult1 = await tool.execute!(
        {
          pattern: '**/*.ts',
          offset: 0,
          limit: 2,
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result1 = await materialize(rawResult1);

      // Get second page
      const rawResult2 = await tool.execute!(
        {
          pattern: '**/*.ts',
          offset: 2,
          limit: 2,
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result2 = await materialize(rawResult2);

      // Pages should have different files
      const paths1 = result1.matches.map((m) => m.path);
      const paths2 = result2.matches.map((m) => m.path);

      expect(result1.matches.length).toBeLessThanOrEqual(2);
      expect(result2.matches.length).toBeGreaterThanOrEqual(0);

      // Ensure no overlap if both pages have results
      if (result2.matches.length > 0) {
        expect(paths1.some((p) => paths2.includes(p))).toBe(false);
      }
    });

    it('should handle offset beyond total matches', async () => {
      const rawResult = await tool.execute!(
        {
          pattern: '**/*.ts',
          offset: 10000,
          limit: 10,
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches.length).toBe(0);
      expect(result.truncated).toBe(false);
    });
  });

  describe('sorting', () => {
    it('should sort files by modification time (newest first)', async () => {
      // Create files with specific modification times
      const now = Date.now();
      const oldFile = join(tempDir, 'old-file.ts');
      const newFile = join(tempDir, 'new-file.ts');

      await createTestFile(oldFile, 'old', new Date(now - 10000));
      await createTestFile(newFile, 'new', new Date(now - 1000));

      const rawResult = await tool.execute!(
        { pattern: '*-file.ts' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches.length).toBe(2);

      // Newer file should be first
      expect(result.matches[0].path).toContain('new-file.ts');
      expect(result.matches[1].path).toContain('old-file.ts');

      // Verify modification times are in descending order
      expect(result.matches[0].modTime).toBeGreaterThan(result.matches[1].modTime);
    });
  });

  describe('error handling', () => {
    it('should return empty results for non-matching pattern', async () => {
      const rawResult = await tool.execute!(
        { pattern: '**/*.nonexistent' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches).toEqual([]);
      expect(result.totalMatches).toBe(0);
      expect(result.truncated).toBe(false);
    });

    it('should handle non-existent directory gracefully', async () => {
      const rawResult = await tool.execute!(
        {
          pattern: '*.ts',
          path: 'nonexistent-directory',
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches).toEqual([]);
      expect(result.totalMatches).toBe(0);
    });

    it('should require pattern parameter', async () => {
      await expect(async () => {
        const rawResult = await tool.execute!({ pattern: '' } as any, {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        });
        await materialize(rawResult);
      }).rejects.toThrow();
    });
  });

  describe('metadata', () => {
    it('should include modification time for each match', async () => {
      const rawResult = await tool.execute!(
        { pattern: '**/*.ts', limit: 5 },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches.length).toBeGreaterThan(0);

      // Every match should have path and modTime
      result.matches.forEach((match) => {
        expect(match).toHaveProperty('path');
        expect(match).toHaveProperty('modTime');
        expect(typeof match.path).toBe('string');
        expect(typeof match.modTime).toBe('number');
        expect(match.modTime).toBeGreaterThan(0);
      });
    });

    it('should set truncated flag correctly', async () => {
      // Request more than available
      const rawResult1 = await tool.execute!(
        { pattern: '**/*.ts', limit: 1000 },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result1 = await materialize(rawResult1);

      expect(result1.truncated).toBe(false);

      // Request less than available
      const rawResult2 = await tool.execute!(
        { pattern: '**/*', limit: 2 },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result2 = await materialize(rawResult2);

      expect(result2.truncated).toBe(true);
    });
  });
});
