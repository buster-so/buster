import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ResolvedConfig } from '../schemas';
import { countModelsInFiles, discoverModelFiles, filterModelFiles } from './discovery';

describe('discovery', () => {
  let testDir: string;

  beforeEach(async () => {
    const testId = Math.random().toString(36).substring(7);
    testDir = join(tmpdir(), `buster-cli-test-${testId}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('discoverModelFiles', () => {
    it('should find all yaml files matching include patterns', async () => {
      // Create test files
      await mkdir(join(testDir, 'models'), { recursive: true });
      await writeFile(join(testDir, 'models', 'users.yml'), 'name: users');
      await writeFile(join(testDir, 'models', 'orders.yaml'), 'name: orders');
      await writeFile(join(testDir, 'products.yml'), 'name: products');
      await writeFile(join(testDir, 'ignored.txt'), 'not a yaml file');

      const config: ResolvedConfig = {
        data_source_name: 'postgres',
        schema: 'public',
        include: ['**/*.yml', '**/*.yaml'],
        exclude: [],
      };

      const files = await discoverModelFiles(config, testDir);

      expect(files).toHaveLength(3);
      expect(files.map((f) => f.replace(testDir, '')).sort()).toEqual([
        '/models/orders.yaml',
        '/models/users.yml',
        '/products.yml',
      ]);
    });

    it('should respect specific include patterns', async () => {
      // Create test files
      await mkdir(join(testDir, 'models'), { recursive: true });
      await mkdir(join(testDir, 'metrics'), { recursive: true });
      await writeFile(join(testDir, 'models', 'users.yml'), 'name: users');
      await writeFile(join(testDir, 'models', 'orders.yml'), 'name: orders');
      await writeFile(join(testDir, 'metrics', 'revenue.yml'), 'name: revenue');

      const config: ResolvedConfig = {
        data_source_name: 'postgres',
        schema: 'public',
        include: ['models/**/*.yml'],
        exclude: [],
      };

      const files = await discoverModelFiles(config, testDir);

      expect(files).toHaveLength(2);
      expect(files.every((f) => f.includes('/models/'))).toBe(true);
    });

    it('should ignore node_modules and other excluded directories', async () => {
      // Create files in directories that should be ignored
      await mkdir(join(testDir, 'node_modules'), { recursive: true });
      await mkdir(join(testDir, 'dist'), { recursive: true });
      await mkdir(join(testDir, '.git'), { recursive: true });
      await mkdir(join(testDir, 'models'), { recursive: true });

      await writeFile(join(testDir, 'node_modules', 'model.yml'), 'name: ignored');
      await writeFile(join(testDir, 'dist', 'model.yml'), 'name: ignored');
      await writeFile(join(testDir, '.git', 'model.yml'), 'name: ignored');
      await writeFile(join(testDir, 'models', 'valid.yml'), 'name: valid');

      const config: ResolvedConfig = {
        data_source_name: 'postgres',
        schema: 'public',
        include: ['**/*.yml'],
        exclude: [],
      };

      const files = await discoverModelFiles(config, testDir);

      expect(files).toHaveLength(1);
      expect(files[0]).toContain('models/valid.yml');
    });

    it('should return empty array when no files match', async () => {
      const config: ResolvedConfig = {
        data_source_name: 'postgres',
        schema: 'public',
        include: ['**/*.yml'],
        exclude: [],
      };

      const files = await discoverModelFiles(config, testDir);

      expect(files).toEqual([]);
    });

    it('should handle deeply nested directories', async () => {
      const deepPath = join(testDir, 'a', 'b', 'c', 'd');
      await mkdir(deepPath, { recursive: true });
      await writeFile(join(deepPath, 'deep.yml'), 'name: deep');

      const config: ResolvedConfig = {
        data_source_name: 'postgres',
        schema: 'public',
        include: ['**/*.yml'],
        exclude: [],
      };

      const files = await discoverModelFiles(config, testDir);

      expect(files).toHaveLength(1);
      expect(files[0]).toContain('a/b/c/d/deep.yml');
    });

    it('should return sorted file paths', async () => {
      await writeFile(join(testDir, 'z.yml'), 'name: z');
      await writeFile(join(testDir, 'a.yml'), 'name: a');
      await writeFile(join(testDir, 'm.yml'), 'name: m');

      const config: ResolvedConfig = {
        data_source_name: 'postgres',
        schema: 'public',
        include: ['*.yml'],
        exclude: [],
      };

      const files = await discoverModelFiles(config, testDir);

      const fileNames = files.map((f) => f.split('/').pop());
      expect(fileNames).toEqual(['a.yml', 'm.yml', 'z.yml']);
    });
  });

  describe('filterModelFiles', () => {
    const testFiles = [
      '/path/to/models/users.yml',
      '/path/to/models/orders.yml',
      '/path/to/test/test-model.yml',
      '/path/to/temp/temp-model.yml',
      '/path/to/metrics/revenue.yml',
    ];

    it('should return all files when no exclusion patterns', async () => {
      const { included, excluded } = await filterModelFiles(testFiles, [], '/path/to');

      expect(included).toEqual(testFiles);
      expect(excluded).toEqual([]);
    });

    it('should exclude files matching single pattern', async () => {
      const { included, excluded } = await filterModelFiles(testFiles, ['**/test/**'], '/path/to');

      expect(included).toHaveLength(4);
      expect(excluded).toHaveLength(1);
      expect(excluded[0]).toEqual({
        file: 'test/test-model.yml',
        reason: 'Matched exclusion pattern: **/test/**',
      });
    });

    it('should exclude files matching multiple patterns', async () => {
      const { included, excluded } = await filterModelFiles(
        testFiles,
        ['**/test/**', '**/temp/**'],
        '/path/to'
      );

      expect(included).toHaveLength(3);
      expect(excluded).toHaveLength(2);
      expect(excluded.map((e) => e.file).sort()).toEqual([
        'temp/temp-model.yml',
        'test/test-model.yml',
      ]);
    });

    it('should handle specific file exclusions', async () => {
      const { included, excluded } = await filterModelFiles(
        testFiles,
        ['models/users.yml'],
        '/path/to'
      );

      expect(included).toHaveLength(4);
      expect(excluded).toHaveLength(1);
      expect(excluded[0]?.file).toBe('models/users.yml');
    });

    it('should handle wildcard patterns', async () => {
      const { included, excluded } = await filterModelFiles(
        testFiles,
        ['**/revenue.*'],
        '/path/to'
      );

      expect(included).toHaveLength(4);
      expect(excluded).toHaveLength(1);
      expect(excluded[0]?.file).toBe('metrics/revenue.yml');
    });

    it('should work with absolute file paths', async () => {
      const absoluteFiles = [
        join(testDir, 'models', 'users.yml'),
        join(testDir, 'test', 'test.yml'),
        join(testDir, 'orders.yml'),
      ];

      const { included, excluded } = await filterModelFiles(absoluteFiles, ['**/test/**'], testDir);

      expect(included).toHaveLength(2);
      expect(excluded).toHaveLength(1);
      expect(excluded[0]?.file).toBe('test/test.yml');
    });

    it('should match first pattern when multiple patterns match', async () => {
      const { excluded } = await filterModelFiles(
        testFiles,
        ['**/test/**', '**/*test*', '**/*.yml'],
        '/path/to'
      );

      const testExclusion = excluded.find((e) => e.file === 'test/test-model.yml');
      expect(testExclusion?.reason).toBe('Matched exclusion pattern: **/test/**');
    });
  });

  describe('countModelsInFiles', () => {
    it('should return the count of files', async () => {
      const files = ['/path/to/model1.yml', '/path/to/model2.yml', '/path/to/model3.yml'];

      const count = await countModelsInFiles(files);

      expect(count).toBe(3);
    });

    it('should return 0 for empty array', async () => {
      const count = await countModelsInFiles([]);

      expect(count).toBe(0);
    });

    it('should handle large file lists', async () => {
      const files = Array.from({ length: 100 }, (_, i) => `/path/to/model${i}.yml`);

      const count = await countModelsInFiles(files);

      expect(count).toBe(100);
    });
  });
});
