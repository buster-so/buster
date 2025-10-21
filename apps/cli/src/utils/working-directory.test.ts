import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  formatWorkingDirectoryContext,
  getCurrentWorkingDirectory,
  getDirectoryTree,
} from './working-directory';

describe('working-directory utilities', () => {
  const testDir = join(__dirname, '.test-working-directory');

  beforeAll(() => {
    // Clean up any existing test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }

    // Create test directory structure
    mkdirSync(testDir, { recursive: true });

    // Create a realistic project structure
    // Root files
    writeFileSync(join(testDir, 'package.json'), '{"name": "test-project"}');
    writeFileSync(join(testDir, 'README.md'), '# Test Project');
    writeFileSync(join(testDir, '.gitignore'), 'node_modules\n.env');

    // apps/ directory
    mkdirSync(join(testDir, 'apps', 'cli', 'src'), { recursive: true });
    writeFileSync(join(testDir, 'apps', 'cli', 'package.json'), '{"name": "@test/cli"}');
    writeFileSync(join(testDir, 'apps', 'cli', 'src', 'index.ts'), 'export {}');

    mkdirSync(join(testDir, 'apps', 'server', 'src'), { recursive: true });
    writeFileSync(join(testDir, 'apps', 'server', 'package.json'), '{"name": "@test/server"}');
    writeFileSync(join(testDir, 'apps', 'server', 'src', 'main.ts'), 'export {}');

    // packages/ directory
    mkdirSync(join(testDir, 'packages', 'ai', 'src'), { recursive: true });
    writeFileSync(join(testDir, 'packages', 'ai', 'package.json'), '{"name": "@test/ai"}');
    writeFileSync(join(testDir, 'packages', 'ai', 'src', 'index.ts'), 'export {}');

    mkdirSync(join(testDir, 'packages', 'database', 'src'), { recursive: true });
    writeFileSync(
      join(testDir, 'packages', 'database', 'package.json'),
      '{"name": "@test/database"}'
    );
    writeFileSync(join(testDir, 'packages', 'database', 'src', 'index.ts'), 'export {}');

    // Ignored directories (should be filtered out)
    mkdirSync(join(testDir, 'node_modules', 'some-package'), { recursive: true });
    writeFileSync(join(testDir, 'node_modules', 'some-package', 'index.js'), 'module.exports = {}');

    mkdirSync(join(testDir, '.git', 'objects'), { recursive: true });
    writeFileSync(join(testDir, '.git', 'config'), '[core]');

    mkdirSync(join(testDir, 'dist', 'bundle'), { recursive: true });
    writeFileSync(join(testDir, 'dist', 'bundle', 'main.js'), 'console.log("bundled")');

    // Hidden files (should be filtered)
    writeFileSync(join(testDir, '.env'), 'SECRET=test');
    writeFileSync(join(testDir, '.DS_Store'), 'mac stuff');
  });

  afterAll(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  describe('getCurrentWorkingDirectory', () => {
    it('should return absolute path of current working directory', () => {
      const cwd = getCurrentWorkingDirectory();

      expect(cwd).toBeDefined();
      expect(typeof cwd).toBe('string');
      expect(cwd.length).toBeGreaterThan(0);
    });

    it('should return resolved path (not relative)', () => {
      const cwd = getCurrentWorkingDirectory();

      // Absolute paths don't start with . or ..
      expect(cwd.startsWith('.')).toBe(false);
      // On Unix-like systems, absolute paths start with /
      // On Windows, they start with C:\ or similar
      expect(cwd.match(/^([a-zA-Z]:\\|\/)/)).toBeTruthy();
    });

    it('should be consistent across multiple calls', () => {
      const cwd1 = getCurrentWorkingDirectory();
      const cwd2 = getCurrentWorkingDirectory();

      expect(cwd1).toBe(cwd2);
    });
  });

  describe('getDirectoryTree', () => {
    it('should return tree structure for directory', () => {
      const tree = getDirectoryTree(testDir, 2);

      expect(tree).toBeDefined();
      expect(typeof tree).toBe('string');
      expect(tree.length).toBeGreaterThan(0);
    });

    it('should include directory name as root', () => {
      const tree = getDirectoryTree(testDir, 2);
      const dirName = testDir.split(/[/\\]/).pop() || testDir;

      expect(tree).toContain(dirName);
    });

    it('should include top-level directories', () => {
      const tree = getDirectoryTree(testDir, 2);

      expect(tree).toContain('apps/');
      expect(tree).toContain('packages/');
    });

    it('should include files at specified depth', () => {
      const tree = getDirectoryTree(testDir, 2);

      // Root level files
      expect(tree).toContain('package.json');
      expect(tree).toContain('README.md');

      // Second level directories
      expect(tree).toContain('cli/');
      expect(tree).toContain('server/');
      expect(tree).toContain('ai/');
      expect(tree).toContain('database/');
    });

    it('should exclude ignored directories', () => {
      const tree = getDirectoryTree(testDir, 2);

      expect(tree).not.toContain('node_modules');
      expect(tree).not.toContain('.git');
      expect(tree).not.toContain('dist');
    });

    it('should exclude hidden files and directories', () => {
      const tree = getDirectoryTree(testDir, 2);

      expect(tree).not.toContain('.env');
      expect(tree).not.toContain('.DS_Store');
      expect(tree).not.toContain('.gitignore');
    });

    it('should respect maxDepth parameter', () => {
      const tree1 = getDirectoryTree(testDir, 1);
      const tree2 = getDirectoryTree(testDir, 2);
      const tree3 = getDirectoryTree(testDir, 3);

      // Depth 1 should be shorter than depth 2
      expect(tree1.length).toBeLessThan(tree2.length);
      // Depth 2 should be shorter than depth 3
      expect(tree2.length).toBeLessThan(tree3.length);

      // Depth 1 should only show top-level dirs
      expect(tree1).toContain('apps/');
      expect(tree1).not.toContain('cli/'); // This is at depth 2

      // Depth 2 should show second level
      expect(tree2).toContain('apps/');
      expect(tree2).toContain('cli/');
    });

    it('should use tree formatting characters', () => {
      const tree = getDirectoryTree(testDir, 2);

      // Should contain tree characters
      expect(tree).toMatch(/[├└│]/);
    });

    it('should sort directories before files', () => {
      const tree = getDirectoryTree(testDir, 2);
      const lines = tree.split('\n');

      // Find lines at same level, directories should come before files
      // Look for apps/ and package.json which are at root level
      const appsIndex = lines.findIndex((line) => line.includes('apps/'));
      const packageJsonIndex = lines.findIndex((line) => line.includes('package.json'));

      expect(appsIndex).toBeGreaterThan(0);
      expect(packageJsonIndex).toBeGreaterThan(0);
      expect(appsIndex).toBeLessThan(packageJsonIndex);
    });

    it('should handle empty directory', () => {
      const emptyDir = join(testDir, 'empty-test-dir');
      mkdirSync(emptyDir, { recursive: true });

      const tree = getDirectoryTree(emptyDir, 2);

      expect(tree).toBeDefined();
      expect(tree).toContain('empty-test-dir');

      // Clean up
      rmSync(emptyDir, { recursive: true });
    });

    it('should handle directory with single file', () => {
      const singleFileDir = join(testDir, 'single-file-dir');
      mkdirSync(singleFileDir, { recursive: true });
      writeFileSync(join(singleFileDir, 'only-file.txt'), 'content');

      const tree = getDirectoryTree(singleFileDir, 2);

      expect(tree).toContain('single-file-dir');
      expect(tree).toContain('only-file.txt');

      // Clean up
      rmSync(singleFileDir, { recursive: true });
    });

    it('should handle maxDepth of 0', () => {
      const tree = getDirectoryTree(testDir, 0);

      // Should only show root directory name
      const lines = tree.split('\n');
      expect(lines.length).toBe(1);
      expect(tree).toContain('.test-working-directory');
    });
  });

  describe('formatWorkingDirectoryContext', () => {
    it('should return formatted string with working directory and tree', () => {
      const context = formatWorkingDirectoryContext(testDir);

      expect(context).toBeDefined();
      expect(typeof context).toBe('string');
    });

    it('should include "Working Directory:" label', () => {
      const context = formatWorkingDirectoryContext(testDir);

      expect(context).toContain('Working Directory:');
    });

    it('should include the directory path', () => {
      const context = formatWorkingDirectoryContext(testDir);

      expect(context).toContain(testDir);
    });

    it('should include "Directory Structure:" label', () => {
      const context = formatWorkingDirectoryContext(testDir);

      expect(context).toContain('Directory Structure:');
    });

    it('should include tree output in code block', () => {
      const context = formatWorkingDirectoryContext(testDir);

      expect(context).toContain('```');
      // Should have opening and closing code fence
      expect(context.match(/```/g)?.length).toBeGreaterThanOrEqual(2);
    });

    it('should include directory tree content', () => {
      const context = formatWorkingDirectoryContext(testDir);

      // Should contain tree structure elements
      expect(context).toContain('apps/');
      expect(context).toContain('packages/');
      expect(context).toContain('package.json');
    });

    it('should not include ignored directories in context', () => {
      const context = formatWorkingDirectoryContext(testDir);

      expect(context).not.toContain('node_modules');
      expect(context).not.toContain('.git');
      expect(context).not.toContain('dist');
    });

    it('should be formatted for use in LLM prompt', () => {
      const context = formatWorkingDirectoryContext(testDir);

      // Should have clear structure suitable for prompts
      const lines = context.split('\n');
      expect(lines.length).toBeGreaterThan(3); // Header + tree + footer
      expect(lines[0]).toContain('Working Directory:');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle directory with special characters in name', () => {
      const specialDir = join(testDir, 'special-chars-!@#$%^');
      mkdirSync(specialDir, { recursive: true });
      writeFileSync(join(specialDir, 'test.txt'), 'content');

      const tree = getDirectoryTree(specialDir, 1);

      expect(tree).toBeDefined();
      expect(tree.length).toBeGreaterThan(0);

      // Clean up
      rmSync(specialDir, { recursive: true });
    });

    it('should handle deep nesting gracefully', () => {
      const deepDir = join(testDir, 'deep', 'very', 'nested', 'structure', 'here');
      mkdirSync(deepDir, { recursive: true });
      writeFileSync(join(deepDir, 'deep-file.txt'), 'content');

      // Should not crash with deep structure
      const tree = getDirectoryTree(join(testDir, 'deep'), 5);

      expect(tree).toBeDefined();

      // Clean up
      rmSync(join(testDir, 'deep'), { recursive: true });
    });

    it('should handle files with no extension', () => {
      const noExtDir = join(testDir, 'no-ext-test');
      mkdirSync(noExtDir, { recursive: true });
      writeFileSync(join(noExtDir, 'LICENSE'), 'MIT');
      writeFileSync(join(noExtDir, 'Dockerfile'), 'FROM node');

      const tree = getDirectoryTree(noExtDir, 1);

      expect(tree).toContain('LICENSE');
      expect(tree).toContain('Dockerfile');

      // Clean up
      rmSync(noExtDir, { recursive: true });
    });
  });
});
