import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { GlobToolContext } from './glob-tool';
import { createGlobToolExecute } from './glob-tool-execute';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('createGlobToolExecute', () => {
  const testDir = path.join(__dirname, 'test-glob-fixtures');
  const context: GlobToolContext = {
    messageId: 'test-message-id',
    projectDirectory: testDir,
  };

  beforeEach(() => {
    // Create test directory structure
    mkdirSync(testDir, { recursive: true });
    mkdirSync(path.join(testDir, 'src'), { recursive: true });
    mkdirSync(path.join(testDir, 'docs'), { recursive: true });

    // Create test files
    writeFileSync(path.join(testDir, 'file1.ts'), 'content');
    writeFileSync(path.join(testDir, 'file2.js'), 'content');
    writeFileSync(path.join(testDir, 'src', 'app.ts'), 'content');
    writeFileSync(path.join(testDir, 'src', 'utils.ts'), 'content');
    writeFileSync(path.join(testDir, 'docs', 'README.md'), 'content');
  });

  afterEach(() => {
    // Clean up test directory
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('successful pattern matching', () => {
    it('should find all TypeScript files', async () => {
      const execute = createGlobToolExecute(context);
      const result = await execute({ pattern: '**/*.ts' });

      expect(result.pattern).toBe('**/*.ts');
      expect(result.matches.length).toBeGreaterThanOrEqual(2);
      expect(result.truncated).toBe(false);
      expect(result.matches.some((m) => m.path.endsWith('app.ts'))).toBe(true);
    });

    it('should find files with specific extension', async () => {
      const execute = createGlobToolExecute(context);
      const result = await execute({ pattern: '*.js' });

      expect(result.matches.length).toBe(1);
      expect(result.matches[0]?.path).toContain('file2.js');
    });

    it('should support alternation patterns', async () => {
      const execute = createGlobToolExecute(context);
      const result = await execute({ pattern: '*.{ts,js}' });

      expect(result.matches.length).toBeGreaterThanOrEqual(2);
    });

    it('should find files in specific directory', async () => {
      const execute = createGlobToolExecute(context);
      const result = await execute({ pattern: 'docs/**/*' });

      expect(result.matches.length).toBe(1);
      expect(result.matches[0]?.path).toContain('README.md');
    });
  });

  describe('pagination', () => {
    it('should respect limit parameter', async () => {
      const execute = createGlobToolExecute(context);
      const result = await execute({ pattern: '**/*', limit: 2 });

      expect(result.matches.length).toBeLessThanOrEqual(2);
      expect(result.truncated).toBe(true);
    });

    it('should respect offset parameter', async () => {
      const execute = createGlobToolExecute(context);
      const allResults = await execute({ pattern: '**/*.ts' });
      const offsetResults = await execute({ pattern: '**/*.ts', offset: 1 });

      expect(offsetResults.matches.length).toBe(allResults.matches.length - 1);
    });

    it('should handle offset beyond available results', async () => {
      const execute = createGlobToolExecute(context);
      const result = await execute({ pattern: '**/*.ts', offset: 100 });

      expect(result.matches.length).toBe(0);
      expect(result.truncated).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle non-matching patterns', async () => {
      const execute = createGlobToolExecute(context);
      const result = await execute({ pattern: '**/*.nonexistent' });

      expect(result.matches.length).toBe(0);
      expect(result.truncated).toBe(false);
    });

    it('should require pattern parameter', async () => {
      const execute = createGlobToolExecute(context);
      await expect(execute({ pattern: '' })).rejects.toThrow('pattern is required');
    });
  });

  describe('sorting', () => {
    it('should sort by modification time (newest first)', async () => {
      const execute = createGlobToolExecute(context);
      const result = await execute({ pattern: '**/*.ts' });

      expect(result.matches.length).toBeGreaterThan(1);
      // Verify sorted order (newest first)
      for (let i = 0; i < result.matches.length - 1; i++) {
        expect(result.matches[i]?.modTime).toBeGreaterThanOrEqual(
          result.matches[i + 1]?.modTime ?? 0
        );
      }
    });
  });
});
