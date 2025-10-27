import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanupTempDir,
  createTempDir,
  createTestStructure,
  type TestFileStructure,
} from '../../../tools/file-tools/test-utils';
import { findDbtModelPathsStep } from './find-dbt-model-paths-step';

describe('findDbtModelPathsStep', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = createTempDir('dbt-test-');
    // Save original cwd and change to temp dir
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Restore original cwd
    process.chdir(originalCwd);
    // Clean up temp directory
    cleanupTempDir(tempDir);
  });

  it('should find a single dbt_project.yml with model-paths', async () => {
    const structure: TestFileStructure = {
      'dbt_project.yml': `
name: my_project
model-paths:
  - models
  - custom_models
`,
    };

    await createTestStructure(tempDir, structure);

    const result = await findDbtModelPathsStep();

    expect(result).toHaveLength(2);
    expect(result).toContain(join(tempDir, 'models'));
    expect(result).toContain(join(tempDir, 'custom_models'));
  });

  it('should find multiple dbt_project.yml files in different directories', async () => {
    const structure: TestFileStructure = {
      'dbt_project.yml': `
name: root_project
model-paths:
  - models
`,
      'project-a/dbt_project.yml': `
name: project_a
model-paths:
  - dbt_models
  - analytics
`,
      'project-b/subfolder/dbt_project.yml': `
name: project_b
model-paths:
  - warehouse_models
`,
    };

    await createTestStructure(tempDir, structure);

    const result = await findDbtModelPathsStep();

    expect(result).toHaveLength(4);
    expect(result).toContain(join(tempDir, 'models'));
    expect(result).toContain(join(tempDir, 'project-a', 'dbt_models'));
    expect(result).toContain(join(tempDir, 'project-a', 'analytics'));
    expect(result).toContain(join(tempDir, 'project-b', 'subfolder', 'warehouse_models'));
  });

  it('should resolve model-paths relative to each dbt_project.yml location', async () => {
    const structure: TestFileStructure = {
      'workspace/dbt_project.yml': `
name: workspace_project
model-paths:
  - models
`,
      'another/folder/dbt_project.yml': `
name: nested_project
model-paths:
  - my_models
`,
    };

    await createTestStructure(tempDir, structure);

    const result = await findDbtModelPathsStep();

    expect(result).toHaveLength(2);
    expect(result).toContain(join(tempDir, 'workspace', 'models'));
    expect(result).toContain(join(tempDir, 'another', 'folder', 'my_models'));
  });

  it('should handle dbt_project.yml without model-paths key', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const structure: TestFileStructure = {
      'dbt_project.yml': `
name: my_project
version: 1.0.0
`,
    };

    await createTestStructure(tempDir, structure);

    const result = await findDbtModelPathsStep();

    expect(result).toHaveLength(0);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No model-paths found'),
      expect.any(String)
    );

    consoleWarnSpy.mockRestore();
  });

  it('should handle invalid YAML gracefully', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const structure: TestFileStructure = {
      'dbt_project.yml': `
name: my_project
model-paths:
  - models
    invalid yaml syntax here
  - more models
`,
    };

    await createTestStructure(tempDir, structure);

    const result = await findDbtModelPathsStep();

    expect(result).toHaveLength(0);
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should return empty array when no dbt_project.yml files exist', async () => {
    const structure: TestFileStructure = {
      'src/index.ts': 'console.log("hello");',
      'README.md': '# My Project',
    };

    await createTestStructure(tempDir, structure);

    const result = await findDbtModelPathsStep();

    expect(result).toHaveLength(0);
  });

  it('should skip node_modules and other excluded directories', async () => {
    const structure: TestFileStructure = {
      'dbt_project.yml': `
name: root_project
model-paths:
  - models
`,
      'node_modules/some-package/dbt_project.yml': `
name: should_be_ignored
model-paths:
  - should_not_appear
`,
      '.git/dbt_project.yml': `
name: should_also_be_ignored
model-paths:
  - should_not_appear_either
`,
    };

    await createTestStructure(tempDir, structure);

    const result = await findDbtModelPathsStep();

    expect(result).toHaveLength(1);
    expect(result).toContain(join(tempDir, 'models'));
    expect(result).not.toContain(expect.stringContaining('node_modules'));
    expect(result).not.toContain(expect.stringContaining('.git'));
  });

  it('should handle deeply nested directory structures', async () => {
    const structure: TestFileStructure = {
      'level1/level2/level3/level4/dbt_project.yml': `
name: deeply_nested
model-paths:
  - nested_models
  - another_path
`,
    };

    await createTestStructure(tempDir, structure);

    const result = await findDbtModelPathsStep();

    expect(result).toHaveLength(2);
    expect(result).toContain(join(tempDir, 'level1/level2/level3/level4', 'nested_models'));
    expect(result).toContain(join(tempDir, 'level1/level2/level3/level4', 'another_path'));
  });

  it('should handle dbt_project.yml with relative path traversal', async () => {
    const structure: TestFileStructure = {
      'project/dbt_project.yml': `
name: relative_paths
model-paths:
  - ../shared_models
  - ./local_models
`,
    };

    await createTestStructure(tempDir, structure);

    const result = await findDbtModelPathsStep();

    expect(result).toHaveLength(2);
    expect(result).toContain(join(tempDir, 'shared_models'));
    expect(result).toContain(join(tempDir, 'project', 'local_models'));
  });

  it('should handle empty model-paths array', async () => {
    const structure: TestFileStructure = {
      'dbt_project.yml': `
name: empty_paths
model-paths: []
`,
    };

    await createTestStructure(tempDir, structure);

    const result = await findDbtModelPathsStep();

    expect(result).toHaveLength(0);
  });

  it('should handle mixed scenario with valid and invalid projects', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const structure: TestFileStructure = {
      'project-valid/dbt_project.yml': `
name: valid_project
model-paths:
  - models
  - analytics
`,
      'project-invalid/dbt_project.yml': `
name: invalid_project
# missing model-paths
version: 1.0.0
`,
      'project-another-valid/dbt_project.yml': `
name: another_valid
model-paths:
  - warehouse
`,
    };

    await createTestStructure(tempDir, structure);

    const result = await findDbtModelPathsStep();

    expect(result).toHaveLength(3);
    expect(result).toContain(join(tempDir, 'project-valid', 'models'));
    expect(result).toContain(join(tempDir, 'project-valid', 'analytics'));
    expect(result).toContain(join(tempDir, 'project-another-valid', 'warehouse'));

    consoleWarnSpy.mockRestore();
  });

  it('should handle complex monorepo structure', async () => {
    const structure: TestFileStructure = {
      'apps/marketing/dbt_project.yml': `
name: marketing
model-paths:
  - models/staging
  - models/marts
`,
      'apps/finance/dbt_project.yml': `
name: finance
model-paths:
  - models
`,
      'packages/shared-dbt/dbt_project.yml': `
name: shared
model-paths:
  - models/common
  - models/utilities
`,
      'services/data-warehouse/analytics/dbt_project.yml': `
name: data_warehouse
model-paths:
  - dwh_models
`,
    };

    await createTestStructure(tempDir, structure);

    const result = await findDbtModelPathsStep();

    expect(result).toHaveLength(6);
    expect(result).toContain(join(tempDir, 'apps/marketing', 'models/staging'));
    expect(result).toContain(join(tempDir, 'apps/marketing', 'models/marts'));
    expect(result).toContain(join(tempDir, 'apps/finance', 'models'));
    expect(result).toContain(join(tempDir, 'packages/shared-dbt', 'models/common'));
    expect(result).toContain(join(tempDir, 'packages/shared-dbt', 'models/utilities'));
    expect(result).toContain(join(tempDir, 'services/data-warehouse/analytics', 'dwh_models'));
  });
});
