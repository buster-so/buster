import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { globTool, multiGlobTool } from '@/tools/file-tools/glob-tool';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

describe('Glob Tool Unit Tests', () => {
  let tempDir: string;
  let sourceDir: string;
  let testsDir: string;

  beforeEach(() => {
    // Create temporary directory structure for tests
    tempDir = join(tmpdir(), `glob-test-${Date.now()}`);
    sourceDir = join(tempDir, 'src');
    testsDir = join(tempDir, 'tests');

    mkdirSync(tempDir, { recursive: true });
    mkdirSync(sourceDir, { recursive: true });
    mkdirSync(testsDir, { recursive: true });
    mkdirSync(join(sourceDir, 'components'), { recursive: true });
    mkdirSync(join(sourceDir, 'utils'), { recursive: true });

    // Create test files
    writeFileSync(join(sourceDir, 'app.ts'), 'export default app;');
    writeFileSync(join(sourceDir, 'index.js'), 'console.log("hello");');
    writeFileSync(join(sourceDir, 'components', 'Button.tsx'), 'export const Button = () => {};');
    writeFileSync(join(sourceDir, 'components', 'Modal.tsx'), 'export const Modal = () => {};');
    writeFileSync(join(sourceDir, 'utils', 'helpers.ts'), 'export const help = () => {};');
    writeFileSync(join(testsDir, 'app.test.ts'), 'test("app", () => {});');
    writeFileSync(join(tempDir, 'README.md'), '# Project');
    writeFileSync(join(tempDir, 'package.json'), '{}');
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
    expect(globTool.id).toBe('glob-search');
    expect(globTool.description).toBe('Find files matching glob patterns with advanced filtering');
    expect(globTool.inputSchema).toBeDefined();
    expect(globTool.outputSchema).toBeDefined();
    expect(globTool.execute).toBeDefined();
  });

  test('should validate input schema', () => {
    const validInput = {
      pattern: '**/*.ts',
      cwd: '/absolute/path',
    };
    const result = globTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate output schema structure', () => {
    const validOutput = {
      pattern: '**/*.ts',
      matches: ['/path/to/file.ts'],
      count: 1,
      truncated: false,
      search_time_ms: 100,
    };

    const result = globTool.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should find TypeScript files with basic pattern', async () => {
    const result = await globTool.execute({
      context: {
        pattern: '**/*.ts',
        cwd: tempDir,
        ignore: [],
      },
    });

    expect(result.count).toBeGreaterThan(0);
    expect(result.matches).toContain('src/app.ts');
    expect(result.matches).toContain('src/utils/helpers.ts');
    expect(result.matches).toContain('tests/app.test.ts');
    expect(result.truncated).toBe(false);
    expect(result.search_time_ms).toBeGreaterThan(0);
  });

  test('should find TypeScript React files with specific pattern', async () => {
    const result = await globTool.execute({
      context: {
        pattern: '**/*.tsx',
        cwd: tempDir,
      },
    });

    expect(result.count).toBe(2);
    expect(result.matches).toContain('src/components/Button.tsx');
    expect(result.matches).toContain('src/components/Modal.tsx');
  });

  test('should find files in specific directory', async () => {
    const result = await globTool.execute({
      context: {
        pattern: 'src/**/*.ts',
        cwd: tempDir,
      },
    });

    expect(result.matches).toContain('src/app.ts');
    expect(result.matches).toContain('src/utils/helpers.ts');
    expect(result.matches).not.toContain('tests/app.test.ts');
  });

  test('should handle absolute paths when requested', async () => {
    const result = await globTool.execute({
      context: {
        pattern: '*.md',
        cwd: tempDir,
        absolute: true,
      },
    });

    expect(result.count).toBe(1);
    expect(result.matches[0]).toEqual(join(tempDir, 'README.md'));
  });

  test('should apply ignore patterns correctly', async () => {
    // Create node_modules directory with files
    const nodeModulesDir = join(tempDir, 'node_modules');
    mkdirSync(nodeModulesDir, { recursive: true });
    writeFileSync(join(nodeModulesDir, 'package.ts'), 'ignored file');

    const result = await globTool.execute({
      context: {
        pattern: '**/*.ts',
        cwd: tempDir,
        ignore: ['**/node_modules/**'],
      },
    });

    expect(result.matches).not.toContain('node_modules/package.ts');
    expect(result.matches).toContain('src/app.ts');
  });

  test('should limit results when specified', async () => {
    const result = await globTool.execute({
      context: {
        pattern: '**/*',
        cwd: tempDir,
        limit: 3,
      },
    });

    expect(result.count).toBe(3);
    expect(result.truncated).toBe(true);
    expect(result.matches).toHaveLength(3);
  });

  test('should handle only_directories option', async () => {
    const result = await globTool.execute({
      context: {
        pattern: '**/*',
        cwd: tempDir,
        only_files: false,
        only_directories: true,
      },
    });

    expect(result.matches).toContain('src');
    expect(result.matches).toContain('tests');
    expect(result.matches).toContain('src/components');
    expect(result.matches).toContain('src/utils');
    expect(result.matches).not.toContain('README.md');
    expect(result.matches).not.toContain('package.json');
  });

  test('should handle max_depth option', async () => {
    const result = await globTool.execute({
      context: {
        pattern: '**/*',
        cwd: tempDir,
        max_depth: 1,
      },
    });

    expect(result.matches).toContain('README.md');
    expect(result.matches).toContain('package.json');
    expect(result.matches).not.toContain('src/app.ts');
    expect(result.matches).not.toContain('src/components/Button.tsx');
  });

  test('should handle empty pattern error', async () => {
    await expect(
      globTool.execute({
        context: {
          pattern: '',
          cwd: tempDir,
        },
      })
    ).rejects.toThrow('Pattern cannot be empty');
  });

  test('should handle invalid patterns gracefully', async () => {
    await expect(
      globTool.execute({
        context: {
          pattern: '[invalid',
          cwd: tempDir,
        },
      })
    ).rejects.toThrow();
  });

  test('should handle non-absolute cwd paths', async () => {
    await expect(
      globTool.execute({
        context: {
          pattern: '*.ts',
          cwd: 'relative/path',
        },
      })
    ).rejects.toThrow('Path must be absolute');
  });

  test('should handle path traversal attempts', async () => {
    await expect(
      globTool.execute({
        context: {
          pattern: '*.ts',
          cwd: '/tmp/../etc',
        },
      })
    ).rejects.toThrow('Path traversal not allowed');
  });

  test('should handle access to sensitive directories', async () => {
    await expect(
      globTool.execute({
        context: {
          pattern: '*.conf',
          cwd: '/etc',
        },
      })
    ).rejects.toThrow('Access denied to path');
  });

  describe('Multi-Glob Tool', () => {
    test('should have correct configuration', () => {
      expect(multiGlobTool.id).toBe('multi-glob-search');
      expect(multiGlobTool.description).toBe('Search with multiple glob patterns simultaneously');
      expect(multiGlobTool.inputSchema).toBeDefined();
      expect(multiGlobTool.outputSchema).toBeDefined();
      expect(multiGlobTool.execute).toBeDefined();
    });

    test('should search with multiple patterns', async () => {
      const result = await multiGlobTool.execute({
        context: {
          patterns: ['**/*.ts', '**/*.tsx', '*.md'],
          cwd: tempDir,
        },
      });

      expect(result.total_matches).toBeGreaterThan(0);

      // Find files that match multiple patterns
      const tsxFiles = result.matches.filter((m) => m.path.endsWith('.tsx'));
      expect(tsxFiles).toHaveLength(2);

      // Find README.md
      const readmeFiles = result.matches.filter((m) => m.path.endsWith('README.md'));
      expect(readmeFiles).toHaveLength(1);

      expect(result.search_time_ms).toBeGreaterThan(0);
    });

    test('should track which patterns matched each file', async () => {
      const result = await multiGlobTool.execute({
        context: {
          patterns: ['**/*.ts', 'src/**/*'],
          cwd: tempDir,
        },
      });

      // Find a TypeScript file in src directory
      const srcTsFile = result.matches.find(
        (m) => m.path.includes('src') && m.path.endsWith('.ts')
      );

      expect(srcTsFile).toBeDefined();
      expect(srcTsFile!.matched_patterns).toContain('**/*.ts');
      expect(srcTsFile!.matched_patterns).toContain('src/**/*');
    });

    test('should validate multi-glob input schema', () => {
      const validInput = {
        patterns: ['**/*.ts', '**/*.js'],
        cwd: '/absolute/path',
      };
      const result = multiGlobTool.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    test('should validate multi-glob output schema', () => {
      const validOutput = {
        patterns: ['**/*.ts'],
        matches: [
          {
            path: '/path/to/file.ts',
            matched_patterns: ['**/*.ts'],
          },
        ],
        total_matches: 1,
        search_time_ms: 100,
      };

      const result = multiGlobTool.outputSchema.safeParse(validOutput);
      expect(result.success).toBe(true);
    });
  });
});
