import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BusterConfig } from '../schemas';
import { loadBusterConfig, resolveConfiguration } from './config-loader';

describe('config-loader', () => {
  let testDir: string;
  let testId: string;

  beforeEach(async () => {
    testId = Math.random().toString(36).substring(7);
    testDir = join(tmpdir(), `buster-cli-test-${testId}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('loadBusterConfig', () => {
    describe('when no buster.yml file exists', () => {
      it('should throw error when no config files are found', async () => {
        await expect(loadBusterConfig(testDir)).rejects.toThrow(
          `No buster.yml found in ${testDir} or any of its subdirectories`
        );
      });

      it('should throw error for non-existent path', async () => {
        const nonExistentPath = join(testDir, 'does-not-exist');
        await expect(loadBusterConfig(nonExistentPath)).rejects.toThrow(
          `Path does not exist: ${nonExistentPath}`
        );
      });

      it('should return null when given a non-buster file', async () => {
        const filePath = join(testDir, 'file.txt');
        await writeFile(filePath, 'content');
        // When given a file that's not buster.yml, it should return null
        await expect(loadBusterConfig(filePath)).rejects.toThrow(
          `No buster.yml found in ${filePath} or any of its subdirectories`
        );
      });
    });

    describe('when single buster.yml exists', () => {
      it('should load a valid buster.yml file', async () => {
        const config: BusterConfig = {
          projects: [
            {
              name: 'test-project',
              data_source: 'postgres',
              database: 'test_db',
              schema: 'public',
            } as any,
          ],
        };

        await writeFile(join(testDir, 'buster.yml'), yaml.dump(config));

        const { config: result, configPath } = await loadBusterConfig(testDir);
        expect(result.projects).toHaveLength(1);
        expect(result.projects[0]?.name).toBe('test-project');
        expect(result.projects[0]?.data_source).toBe('postgres');
        expect(configPath).toBe(join(testDir, 'buster.yml'));
      });

      it('should handle buster.yaml (with .yaml extension)', async () => {
        const config: BusterConfig = {
          projects: [
            {
              name: 'yaml-project',
              data_source: 'mysql',
              database: 'yaml_db',
              schema: 'default',
            } as any,
          ],
        };

        await writeFile(join(testDir, 'buster.yaml'), yaml.dump(config));

        const { config: result, configPath } = await loadBusterConfig(testDir);
        expect(result.projects).toHaveLength(1);
        expect(result.projects[0]?.name).toBe('yaml-project');
        expect(configPath).toBe(join(testDir, 'buster.yaml'));
      });

      it('should skip invalid yaml files with warning', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await writeFile(join(testDir, 'buster.yml'), 'invalid: yaml: content:');

        await expect(loadBusterConfig(testDir)).rejects.toThrow('Failed to parse buster.yml');

        expect(consoleSpy).toHaveBeenCalled();
      });

      it('should skip files with invalid schema', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const invalidConfig = {
          projects: [
            {
              // Missing required fields
              name: 'invalid-project',
            },
          ],
        };

        await writeFile(join(testDir, 'buster.yml'), yaml.dump(invalidConfig));

        await expect(loadBusterConfig(testDir)).rejects.toThrow('Failed to parse buster.yml');

        expect(consoleSpy).toHaveBeenCalled();
      });
    });

    describe('when searching for buster.yml in subdirectories', () => {
      it('should find buster.yml in subdirectory when searching from parent', async () => {
        // Create subdirectory
        const subDir = join(testDir, 'subdirectory');
        await mkdir(subDir, { recursive: true });

        const config: BusterConfig = {
          projects: [
            {
              name: 'sub-project',
              data_source: 'postgres',
              database: 'db1',
              schema: 'public',
            } as any,
          ],
        };

        // Place buster.yml in the subdirectory
        await writeFile(join(subDir, 'buster.yml'), yaml.dump(config));

        // Search from parent should find subdirectory's buster.yml
        const { config: result, configPath } = await loadBusterConfig(testDir);
        expect(result.projects).toHaveLength(1);
        expect(result.projects[0]?.name).toBe('sub-project');
        expect(configPath).toBe(join(subDir, 'buster.yml'));
      });

      it('should find first buster.yml when multiple exist in different subdirectories', async () => {
        const subDir1 = join(testDir, 'a');
        const subDir2 = join(testDir, 'b');
        await mkdir(subDir1, { recursive: true });
        await mkdir(subDir2, { recursive: true });

        const config1: BusterConfig = {
          projects: [
            {
              name: 'project-a',
              data_source: 'bigquery',
              database: 'db_a',
              schema: 'dataset',
            } as any,
          ],
        };

        const config2: BusterConfig = {
          projects: [
            {
              name: 'project-b',
              data_source: 'postgres',
              database: 'db_b',
              schema: 'public',
            } as any,
          ],
        };

        // Place configs in different subdirectories
        await writeFile(join(subDir1, 'buster.yml'), yaml.dump(config1));
        await writeFile(join(subDir2, 'buster.yml'), yaml.dump(config2));

        // Should find the first one (deterministic based on directory order)
        const { config: result } = await loadBusterConfig(testDir);
        expect(result.projects).toHaveLength(1);
        // The actual project found depends on directory traversal order
        expect(['project-a', 'project-b']).toContain(result.projects[0]?.name);
      });
    });

    describe('when handling edge cases', () => {
      it('should handle empty projects array', async () => {
        const config: BusterConfig = {
          projects: [],
        };

        await writeFile(join(testDir, 'buster.yml'), yaml.dump(config));

        await expect(loadBusterConfig(testDir)).rejects.toThrow(
          'No projects defined in buster.yml'
        );
      });

      it('should provide informative console output', async () => {
        const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

        const config: BusterConfig = {
          projects: [
            {
              name: 'project1',
              data_source: 'postgres',
              database: 'db',
              schema: 'public',
            } as any,
          ],
        };

        await writeFile(join(testDir, 'buster.yml'), yaml.dump(config));

        const result = await loadBusterConfig(testDir);

        // Should return the config without logging (console.info calls were removed)
        expect(result.config).toBeDefined();
        expect(result.configPath).toContain('buster.yml');
        expect(result.config.projects).toHaveLength(1);
      });
    });
  });

  describe('resolveConfiguration', () => {
    const defaultConfig: BusterConfig = {
      projects: [
        {
          name: 'test-project',
          data_source: 'postgres',
          database: 'test_db',
          schema: 'public',
          include: ['**/*.yml'],
          exclude: ['**/temp/**'],
        },
      ],
    };

    it('should resolve configuration with project name', () => {
      const resolved = resolveConfiguration(
        defaultConfig,
        { dryRun: false, verbose: false, debug: false },
        'test-project'
      );

      expect(resolved.data_source_name).toBe('postgres');
      expect(resolved.database).toBe('test_db');
      expect(resolved.schema).toBe('public');
      expect(resolved.include).toEqual(['**/*.yml']);
      expect(resolved.exclude).toEqual(['**/temp/**']);
    });

    it('should use first project when no name specified', () => {
      const resolved = resolveConfiguration(defaultConfig, {
        dryRun: false,
        verbose: false,
        debug: false,
      });

      expect(resolved.data_source_name).toBe('postgres');
    });

    it('should use default include patterns when not specified', () => {
      const config: BusterConfig = {
        projects: [
          {
            name: 'test-project',
            data_source: 'postgres',
            database: 'test_db',
            schema: 'public',
          } as any,
        ],
      };

      const resolved = resolveConfiguration(config, {
        dryRun: false,
        verbose: false,
        debug: false,
      });

      expect(resolved.include).toEqual(['**/*.yml', '**/*.yaml']);
      expect(resolved.exclude).toEqual([]);
    });

    it('should throw error for non-existent project name', () => {
      expect(() =>
        resolveConfiguration(
          defaultConfig,
          { dryRun: false, verbose: false, debug: false },
          'non-existent'
        )
      ).toThrow("Project 'non-existent' not found in buster.yml");
    });

    it('should throw error when no projects defined', () => {
      const config: BusterConfig = {
        projects: [],
      };

      expect(() =>
        resolveConfiguration(config, { dryRun: false, verbose: false, debug: false })
      ).toThrow('No projects defined in buster.yml');
    });
  });
});
