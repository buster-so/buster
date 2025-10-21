import { join } from 'node:path';
import { materialize } from '@buster/test-utils';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanupTempDir, createTempDir, createTestStructure } from '../test-utils';
import type { GrepToolContext } from './grep-tool';
import { createGrepTool } from './grep-tool';

describe.sequential('grep-tool integration tests', () => {
  let tempDir: string;
  let originalCwd: string;
  let tool: ReturnType<typeof createGrepTool>;
  let context: GrepToolContext;

  beforeAll(async () => {
    // Save original working directory
    originalCwd = process.cwd();

    // Create temp directory
    tempDir = createTempDir('grep-test-');

    // Change to temp directory
    process.chdir(tempDir);

    // Create test files with searchable content
    await createTestStructure(tempDir, {
      'config.ts': `
export const API_KEY = 'secret123';
export const API_URL = 'https://api.example.com';
export const TIMEOUT = 5000;
export const MAX_RETRIES = 3;
      `,
      'database.ts': `
import { config } from './config';

export function connect() {
  return db.connect(config.API_URL);
}

export function disconnect() {
  return db.disconnect();
}
      `,
      'utils.ts': `
export function formatDate(date: Date) {
  return date.toISOString();
}

export function formatNumber(num: number) {
  return num.toLocaleString();
}

export const API_VERSION = 'v2';
      `,
      'components/Button.tsx': `
export const Button = ({ label }: { label: string }) => {
  return <button>{label}</button>;
};
      `,
      'tests/utils.test.ts': `
import { formatDate } from '../utils';

describe('formatDate', () => {
  it('should format date', () => {
    expect(formatDate).toBeDefined();
  });
});
      `,
      'README.md': `
# Project Title

This is a test project with API integration.

## Features

- API_KEY configuration
- Database connection
- Utilities for formatting
      `,
    });

    // Create context
    context = {
      messageId: 'test-message-id',
      projectDirectory: tempDir,
      onToolEvent: vi.fn(),
    };

    // Create tool
    tool = createGrepTool(context);

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

  describe('literal string search', () => {
    it('should find literal string matches', async () => {
      const rawResult = await tool.execute!(
        { pattern: 'API_KEY' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.pattern).toBe('API_KEY');
      expect(result.matches.length).toBeGreaterThan(0);

      // Should find matches in config.ts and README.md
      const paths = result.matches.map((m) => m.path);
      expect(paths.some((p) => p.includes('config.ts'))).toBe(true);

      // Verify match details
      const configMatch = result.matches.find((m) => m.path.includes('config.ts'));
      expect(configMatch).toBeDefined();
      expect(configMatch!.lineText).toContain('API_KEY');
      expect(configMatch!.lineNum).toBeGreaterThan(0);
    });

    it('should find export statements', async () => {
      const rawResult = await tool.execute!(
        { pattern: 'export const' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches.length).toBeGreaterThan(0);

      const paths = result.matches.map((m) => m.path);
      expect(paths.some((p) => p.includes('config.ts'))).toBe(true);
      expect(paths.some((p) => p.includes('utils.ts'))).toBe(true);
    });

    it('should find function definitions', async () => {
      const rawResult = await tool.execute!(
        { pattern: 'export function' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches.length).toBeGreaterThan(0);

      const paths = result.matches.map((m) => m.path);
      expect(paths.some((p) => p.includes('database.ts') || p.includes('utils.ts'))).toBe(true);
    });
  });

  describe('regex patterns', () => {
    it('should support regex patterns', async () => {
      const rawResult = await tool.execute!(
        { pattern: 'export (const|function)' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches.length).toBeGreaterThan(0);

      // Should find both const and function exports
      const matchTexts = result.matches.map((m) => m.lineText);
      expect(matchTexts.some((text) => text.includes('export const'))).toBe(true);
      expect(matchTexts.some((text) => text.includes('export function'))).toBe(true);
    });

    it('should match word boundaries', async () => {
      const rawResult = await tool.execute!(
        { pattern: '\\bAPI\\w+' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches.length).toBeGreaterThan(0);

      // Should find API_KEY, API_URL, API_VERSION
      const matchTexts = result.matches.map((m) => m.lineText);
      expect(matchTexts.some((text) => text.includes('API_KEY'))).toBe(true);
      expect(matchTexts.some((text) => text.includes('API_URL'))).toBe(true);
    });
  });

  describe('file filtering with glob', () => {
    it('should filter by file extension with glob', async () => {
      const rawResult = await tool.execute!(
        {
          pattern: 'export',
          glob: '*.ts',
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches.length).toBeGreaterThan(0);

      // Should only find matches in .ts files
      const paths = result.matches.map((m) => m.path);
      expect(paths.every((p) => p.endsWith('.ts'))).toBe(true);
      expect(paths.some((p) => p.endsWith('.tsx'))).toBe(false);
      expect(paths.some((p) => p.endsWith('.md'))).toBe(false);
    });

    it('should support glob alternation patterns', async () => {
      const rawResult = await tool.execute!(
        {
          pattern: 'export',
          glob: '*.{ts,tsx}',
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches.length).toBeGreaterThan(0);

      // Should find matches in both .ts and .tsx files
      const paths = result.matches.map((m) => m.path);
      expect(paths.some((p) => p.endsWith('.ts'))).toBe(true);
      expect(paths.some((p) => p.endsWith('.tsx'))).toBe(true);
    });

    it('should filter by specific file pattern', async () => {
      const rawResult = await tool.execute!(
        {
          pattern: 'formatDate',
          glob: '*.test.ts',
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches.length).toBeGreaterThan(0);

      // Should only find matches in test files
      const paths = result.matches.map((m) => m.path);
      expect(paths.every((p) => p.includes('.test.ts'))).toBe(true);
    });
  });

  describe('path filtering', () => {
    it('should search in specific subdirectory', async () => {
      const rawResult = await tool.execute!(
        {
          pattern: 'formatDate',
          path: join(tempDir, 'tests'),
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      // Should only find matches in tests/ directory
      const paths = result.matches.map((m) => m.path);
      expect(paths.every((p) => p.includes('tests'))).toBe(true);
    });
  });

  describe('pagination', () => {
    it('should paginate results with limit', async () => {
      const rawResult = await tool.execute!(
        {
          pattern: 'export',
          limit: 3,
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches.length).toBeLessThanOrEqual(3);
      if (result.truncated) {
        expect(result.matches.length).toBe(3);
      }
    });

    it('should handle offset and limit for pagination', async () => {
      // Get first page
      const rawResult1 = await tool.execute!(
        {
          pattern: 'export',
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
          pattern: 'export',
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

      // Pages should have different lines
      if (result1.matches.length > 0 && result2.matches.length > 0) {
        const lines1 = result1.matches.map((m) => `${m.path}:${m.lineNum}`);
        const lines2 = result2.matches.map((m) => `${m.path}:${m.lineNum}`);

        expect(lines1.some((l) => lines2.includes(l))).toBe(false);
      }
    });
  });

  describe('match metadata', () => {
    it('should include line numbers', async () => {
      const rawResult = await tool.execute!(
        { pattern: 'API_KEY' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches.length).toBeGreaterThan(0);

      result.matches.forEach((match) => {
        expect(match.lineNum).toBeGreaterThan(0);
        expect(typeof match.lineNum).toBe('number');
      });
    });

    it('should include line text', async () => {
      const rawResult = await tool.execute!(
        { pattern: 'API_KEY' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches.length).toBeGreaterThan(0);

      result.matches.forEach((match) => {
        expect(match.lineText).toBeTruthy();
        expect(typeof match.lineText).toBe('string');
        expect(match.lineText.length).toBeGreaterThan(0);
      });
    });

    it('should include modification time', async () => {
      const rawResult = await tool.execute!(
        { pattern: 'API_KEY' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches.length).toBeGreaterThan(0);

      result.matches.forEach((match) => {
        expect(match.modTime).toBeGreaterThan(0);
        expect(typeof match.modTime).toBe('number');
      });
    });

    it('should flag truncated lines', async () => {
      // Create a file with a very long line
      await createTestStructure(tempDir, {
        'long-line.ts': `export const VERY_LONG_LINE = '${'x'.repeat(3000)}';`,
      });

      const rawResult = await tool.execute!(
        { pattern: 'VERY_LONG_LINE' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.matches.length).toBeGreaterThan(0);

      const longLineMatch = result.matches.find((m) => m.path.includes('long-line.ts'));
      expect(longLineMatch).toBeDefined();
      expect(longLineMatch!.lineTruncated).toBe(true);
      expect(longLineMatch!.lineText).toContain('(line truncated)');
    });
  });

  describe('error handling', () => {
    it('should return empty results for no matches', async () => {
      const rawResult = await tool.execute!(
        { pattern: 'NONEXISTENT_PATTERN_12345' },
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
          pattern: 'export',
          path: join(tempDir, 'nonexistent-directory'),
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      // Should return empty results without throwing
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

  describe('sorting', () => {
    it('should sort matches by modification time (newest first)', async () => {
      const rawResult = await tool.execute!(
        { pattern: 'export' },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      if (result.matches.length > 1) {
        // Verify modification times are in descending order
        for (let i = 0; i < result.matches.length - 1; i++) {
          expect(result.matches[i].modTime).toBeGreaterThanOrEqual(result.matches[i + 1].modTime);
        }
      }
    });
  });
});
