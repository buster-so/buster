import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  cleanupTempDir,
  createTempDir,
  createTestStructure,
  type TestFileStructure,
} from '../../../tools/file-tools/test-utils';
import {
  buildModelQueueItem,
  buildModelsQueue,
  buildModelsQueueStep,
  isValidModelFile,
  walkModelDirectory,
} from './build-models-queue-step';

describe('isValidModelFile', () => {
  it('should return true for .sql files', () => {
    expect(isValidModelFile('/path/to/models/dim_customers.sql', 'dim_customers.sql')).toBe(true);
  });

  it('should return false for non-.sql files', () => {
    expect(isValidModelFile('/path/to/models/config.yml', 'config.yml')).toBe(false);
    expect(isValidModelFile('/path/to/models/README.md', 'README.md')).toBe(false);
    expect(isValidModelFile('/path/to/models/script.py', 'script.py')).toBe(false);
  });

  it('should return false for files in analysis directory', () => {
    expect(isValidModelFile('/path/to/analysis/exploration.sql', 'exploration.sql')).toBe(false);
  });

  it('should return false for files in tests directory', () => {
    expect(isValidModelFile('/path/to/tests/test_query.sql', 'test_query.sql')).toBe(false);
  });

  it('should return false for files in snapshots directory', () => {
    expect(isValidModelFile('/path/to/snapshots/snap_orders.sql', 'snap_orders.sql')).toBe(false);
  });

  it('should return false for files in macros directory', () => {
    expect(isValidModelFile('/path/to/macros/my_macro.sql', 'my_macro.sql')).toBe(false);
  });

  it('should return false for files in target directory', () => {
    expect(isValidModelFile('/path/to/target/compiled.sql', 'compiled.sql')).toBe(false);
  });

  it('should return false for files in hidden directories', () => {
    expect(isValidModelFile('/path/to/.git/query.sql', 'query.sql')).toBe(false);
  });
});

describe('buildModelQueueItem', () => {
  it('should build correct metadata for a model file', () => {
    const result = buildModelQueueItem(
      '/project/models/staging/stg_customers.sql',
      '/project/models'
    );

    expect(result).toEqual({
      absolutePath: '/project/models/staging/stg_customers.sql',
      relativePath: 'staging/stg_customers.sql',
      fileName: 'stg_customers.sql',
      modelName: 'stg_customers',
      modelDirectory: '/project/models',
    });
  });

  it('should handle deeply nested models', () => {
    const result = buildModelQueueItem(
      '/project/models/marts/finance/revenue/fct_revenue.sql',
      '/project/models'
    );

    expect(result).toEqual({
      absolutePath: '/project/models/marts/finance/revenue/fct_revenue.sql',
      relativePath: 'marts/finance/revenue/fct_revenue.sql',
      fileName: 'fct_revenue.sql',
      modelName: 'fct_revenue',
      modelDirectory: '/project/models',
    });
  });

  it('should handle models in root of model directory', () => {
    const result = buildModelQueueItem('/project/models/my_model.sql', '/project/models');

    expect(result).toEqual({
      absolutePath: '/project/models/my_model.sql',
      relativePath: 'my_model.sql',
      fileName: 'my_model.sql',
      modelName: 'my_model',
      modelDirectory: '/project/models',
    });
  });
});

describe('walkModelDirectory', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir('models-test-');
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should find all .sql files in a flat directory', async () => {
    const structure: TestFileStructure = {
      'dim_customers.sql': '-- customer dimension',
      'fct_orders.sql': '-- orders fact',
      'stg_users.sql': '-- staging users',
    };

    await createTestStructure(tempDir, structure);

    const result = await walkModelDirectory(tempDir);

    expect(result).toHaveLength(3);
    expect(result).toContain(join(tempDir, 'dim_customers.sql'));
    expect(result).toContain(join(tempDir, 'fct_orders.sql'));
    expect(result).toContain(join(tempDir, 'stg_users.sql'));
  });

  it('should find .sql files in nested directories', async () => {
    const structure: TestFileStructure = {
      'staging/stg_customers.sql': '-- staging',
      'staging/stg_orders.sql': '-- staging',
      'marts/dim_customers.sql': '-- marts',
      'marts/fct_orders.sql': '-- marts',
    };

    await createTestStructure(tempDir, structure);

    const result = await walkModelDirectory(tempDir);

    expect(result).toHaveLength(4);
    expect(result).toContain(join(tempDir, 'staging/stg_customers.sql'));
    expect(result).toContain(join(tempDir, 'staging/stg_orders.sql'));
    expect(result).toContain(join(tempDir, 'marts/dim_customers.sql'));
    expect(result).toContain(join(tempDir, 'marts/fct_orders.sql'));
  });

  it('should skip files in analysis directory', async () => {
    const structure: TestFileStructure = {
      'staging/stg_data.sql': '-- staging',
      'analysis/exploration.sql': '-- should skip',
      'marts/dim_data.sql': '-- marts',
    };

    await createTestStructure(tempDir, structure);

    const result = await walkModelDirectory(tempDir);

    expect(result).toHaveLength(2);
    expect(result).toContain(join(tempDir, 'staging/stg_data.sql'));
    expect(result).toContain(join(tempDir, 'marts/dim_data.sql'));
    expect(result).not.toContain(join(tempDir, 'analysis/exploration.sql'));
  });

  it('should skip files in tests directory', async () => {
    const structure: TestFileStructure = {
      'staging/stg_data.sql': '-- staging',
      'tests/test_query.sql': '-- should skip',
    };

    await createTestStructure(tempDir, structure);

    const result = await walkModelDirectory(tempDir);

    expect(result).toHaveLength(1);
    expect(result).toContain(join(tempDir, 'staging/stg_data.sql'));
  });

  it('should skip files in snapshots directory', async () => {
    const structure: TestFileStructure = {
      'staging/stg_data.sql': '-- staging',
      'snapshots/snap_orders.sql': '-- should skip',
    };

    await createTestStructure(tempDir, structure);

    const result = await walkModelDirectory(tempDir);

    expect(result).toHaveLength(1);
    expect(result).toContain(join(tempDir, 'staging/stg_data.sql'));
  });

  it('should skip hidden directories', async () => {
    const structure: TestFileStructure = {
      'staging/stg_data.sql': '-- staging',
      '.git/query.sql': '-- should skip',
    };

    await createTestStructure(tempDir, structure);

    const result = await walkModelDirectory(tempDir);

    expect(result).toHaveLength(1);
    expect(result).toContain(join(tempDir, 'staging/stg_data.sql'));
  });

  it('should only include .sql files and skip other file types', async () => {
    const structure: TestFileStructure = {
      'my_model.sql': '-- model',
      'config.yml': 'config: value',
      'README.md': '# Readme',
      'script.py': 'print("hello")',
    };

    await createTestStructure(tempDir, structure);

    const result = await walkModelDirectory(tempDir);

    expect(result).toHaveLength(1);
    expect(result).toContain(join(tempDir, 'my_model.sql'));
  });

  it('should handle deeply nested structures', async () => {
    const structure: TestFileStructure = {
      'l1/l2/l3/l4/deep_model.sql': '-- deep',
    };

    await createTestStructure(tempDir, structure);

    const result = await walkModelDirectory(tempDir);

    expect(result).toHaveLength(1);
    expect(result).toContain(join(tempDir, 'l1/l2/l3/l4/deep_model.sql'));
  });

  it('should return empty array for directory with no .sql files', async () => {
    const structure: TestFileStructure = {
      'config.yml': 'config: value',
      'README.md': '# Readme',
    };

    await createTestStructure(tempDir, structure);

    const result = await walkModelDirectory(tempDir);

    expect(result).toHaveLength(0);
  });

  it('should handle empty directory', async () => {
    const result = await walkModelDirectory(tempDir);

    expect(result).toHaveLength(0);
  });
});

describe('buildModelsQueue', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir('queue-test-');
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should build queue from single model directory', async () => {
    const modelsDir = join(tempDir, 'models');
    const structure: TestFileStructure = {
      'models/staging/stg_customers.sql': '-- staging',
      'models/marts/dim_customers.sql': '-- marts',
    };

    await createTestStructure(tempDir, structure);

    const result = await buildModelsQueue([modelsDir]);

    expect(result).toHaveLength(2);

    const modelNames = result.map((m) => m.modelName).sort();
    expect(modelNames).toEqual(['dim_customers', 'stg_customers']);

    const stagingModel = result.find((m) => m.modelName === 'stg_customers');
    expect(stagingModel).toMatchObject({
      fileName: 'stg_customers.sql',
      modelName: 'stg_customers',
      relativePath: 'staging/stg_customers.sql',
      modelDirectory: modelsDir,
    });

    const martsModel = result.find((m) => m.modelName === 'dim_customers');
    expect(martsModel).toMatchObject({
      fileName: 'dim_customers.sql',
      modelName: 'dim_customers',
      relativePath: 'marts/dim_customers.sql',
      modelDirectory: modelsDir,
    });
  });

  it('should build queue from multiple model directories', async () => {
    const modelsA = join(tempDir, 'project-a/models');
    const modelsB = join(tempDir, 'project-b/analytics');

    const structure: TestFileStructure = {
      'project-a/models/dim_users.sql': '-- users',
      'project-b/analytics/fct_events.sql': '-- events',
    };

    await createTestStructure(tempDir, structure);

    const result = await buildModelsQueue([modelsA, modelsB]);

    expect(result).toHaveLength(2);

    const usersModel = result.find((m) => m.modelName === 'dim_users');
    expect(usersModel).toMatchObject({
      modelName: 'dim_users',
      modelDirectory: modelsA,
      relativePath: 'dim_users.sql',
    });

    const eventsModel = result.find((m) => m.modelName === 'fct_events');
    expect(eventsModel).toMatchObject({
      modelName: 'fct_events',
      modelDirectory: modelsB,
      relativePath: 'fct_events.sql',
    });
  });

  it('should handle empty model paths array', async () => {
    const result = await buildModelsQueue([]);

    expect(result).toHaveLength(0);
  });

  it('should handle model directory with no files', async () => {
    const modelsDir = join(tempDir, 'models');
    const structure: TestFileStructure = {
      'models/README.md': '# Models',
    };

    await createTestStructure(tempDir, structure);

    const result = await buildModelsQueue([modelsDir]);

    expect(result).toHaveLength(0);
  });

  it('should skip excluded directories across all model paths', async () => {
    const modelsDir = join(tempDir, 'models');
    const structure: TestFileStructure = {
      'models/staging/stg_data.sql': '-- include',
      'models/analysis/explore.sql': '-- exclude',
      'models/tests/test.sql': '-- exclude',
    };

    await createTestStructure(tempDir, structure);

    const result = await buildModelsQueue([modelsDir]);

    expect(result).toHaveLength(1);
    expect(result[0].modelName).toBe('stg_data');
  });
});

describe('buildModelsQueueStep', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir('step-test-');
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('should execute and return models', async () => {
    const modelsDir = join(tempDir, 'models');
    const structure: TestFileStructure = {
      'models/staging/stg_customers.sql': '-- staging',
      'models/marts/dim_customers.sql': '-- marts',
      'models/marts/fct_orders.sql': '-- marts',
    };

    await createTestStructure(tempDir, structure);

    const result = await buildModelsQueue([modelsDir]);

    expect(result).toHaveLength(3);
    const modelNames = result.map((m) => m.modelName).sort();
    expect(modelNames).toEqual(['dim_customers', 'fct_orders', 'stg_customers']);
  });

  it('should handle complex monorepo structure', async () => {
    const structure: TestFileStructure = {
      'apps/marketing/models/staging/stg_campaigns.sql': '-- campaigns',
      'apps/marketing/models/marts/dim_campaigns.sql': '-- campaigns',
      'apps/finance/models/staging/stg_transactions.sql': '-- transactions',
      'packages/shared/models/utils/util_dates.sql': '-- utils',
    };

    await createTestStructure(tempDir, structure);

    const modelPaths = [
      join(tempDir, 'apps/marketing/models'),
      join(tempDir, 'apps/finance/models'),
      join(tempDir, 'packages/shared/models'),
    ];

    const result = await buildModelsQueue(modelPaths);

    expect(result).toHaveLength(4);
    const modelNames = result.map((m) => m.modelName).sort();
    expect(modelNames).toEqual([
      'dim_campaigns',
      'stg_campaigns',
      'stg_transactions',
      'util_dates',
    ]);
  });
});
