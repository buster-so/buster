import { describe, expect, it } from 'vitest';
import type { CLIDeploymentResult } from '../schemas';
import {
  createModelFileMap,
  createParseFailures,
  formatDeploymentSummary,
  mergeDeploymentResults,
  processDeploymentResponse,
} from './results';

describe('formatDeploymentSummary', () => {
  it('should format successful deployment with no errors', () => {
    const result: CLIDeploymentResult = {
      success: [
        { file: 'models/users.yml', modelName: 'users', dataSource: 'postgres' },
        { file: 'models/orders.yml', modelName: 'orders', dataSource: 'postgres' },
      ],
      updated: [{ file: 'models/products.yml', modelName: 'products', dataSource: 'postgres' }],
      noChange: [{ file: 'models/customers.yml', modelName: 'customers', dataSource: 'postgres' }],
      failures: [],
      excluded: [],
      todos: [],
    };

    const summary = formatDeploymentSummary(result, false, false);

    expect(summary).toContain('Deployment Results');
    expect(summary).toContain('4 models deployed');
    expect(summary).toContain('• 2 new');
    expect(summary).toContain('• 1 updated');
    expect(summary).toContain('• 1 unchanged');
    expect(summary).toContain('✓ Deployment completed successfully');
    expect(summary).not.toContain('models failed');
    expect(summary).not.toContain('files need completion');
  });

  it('should format deployment with failures', () => {
    const result: CLIDeploymentResult = {
      success: [],
      updated: [],
      noChange: [],
      failures: [
        {
          file: 'models/users.yml',
          modelName: 'users',
          errors: ['Missing required field: data_source_name', 'Invalid SQL syntax'],
        },
        {
          file: 'models/orders.yml',
          modelName: 'orders',
          errors: ['Duplicate dimension name: id'],
        },
      ],
      excluded: [],
      todos: [],
    };

    const summary = formatDeploymentSummary(result, false, false);

    expect(summary).toContain('2 models failed');
    expect(summary).toContain('users.yml');
    expect(summary).toContain('Missing required field: data_source_name');
    expect(summary).toContain('orders.yml');
    expect(summary).toContain('Duplicate dimension name: id');
    expect(summary).toContain('✗ Deployment completed with 2 errors');
  });

  it('should format deployment with TODO files', () => {
    const result: CLIDeploymentResult = {
      success: [{ file: 'models/users.yml', modelName: 'users', dataSource: 'postgres' }],
      updated: [],
      noChange: [],
      failures: [],
      excluded: [],
      todos: [
        { file: 'models/products.yml' },
        { file: 'models/inventory.yml' },
        { file: 'models/categories.yml' },
      ],
    };

    const summary = formatDeploymentSummary(result, false, false);

    expect(summary).toContain('3 files need completion');
    expect(summary).toContain('products.yml');
    expect(summary).toContain('inventory.yml');
    expect(summary).toContain('categories.yml');
    expect(summary).toContain('⚠ Deployment completed with 3 files needing completion');
  });

  it('should format deployment with doc results', () => {
    const result: CLIDeploymentResult = {
      success: [{ file: 'models/users.yml', modelName: 'users', dataSource: 'postgres' }],
      updated: [],
      noChange: [],
      failures: [],
      excluded: [],
      todos: [],
      docs: {
        created: ['README.md', 'API.md'],
        updated: ['CHANGELOG.md'],
        deleted: ['deprecated.md'],
        failed: [{ name: 'failed.md', error: 'Storage error' }],
        summary: {
          createdCount: 2,
          updatedCount: 1,
          deletedCount: 1,
          totalDocs: 4,
          failedCount: 1,
        },
      },
    };

    const summary = formatDeploymentSummary(result, false, false);

    expect(summary).toContain('1 model deployed');
    expect(summary).toContain('3 docs deployed');
    expect(summary).toContain('• 2 new');
    expect(summary).toContain('• 1 updated');
    expect(summary).toContain('• 1 deleted');
    expect(summary).toContain('1 doc failed');
    expect(summary).toContain('failed.md: Storage error');
    expect(summary).toContain('✗ Deployment completed with 1 error');
  });

  it('should show doc details in verbose mode', () => {
    const result: CLIDeploymentResult = {
      success: [],
      updated: [],
      noChange: [],
      failures: [],
      excluded: [],
      todos: [],
      docs: {
        created: ['README.md', 'API.md', 'GUIDE.md'],
        updated: ['CHANGELOG.md'],
        deleted: ['old1.md', 'old2.md'],
        failed: [],
        summary: {
          createdCount: 3,
          updatedCount: 1,
          deletedCount: 2,
          totalDocs: 6,
          failedCount: 0,
        },
      },
    };

    const summary = formatDeploymentSummary(result, true, false);

    expect(summary).toContain('New docs:');
    expect(summary).toContain('- README.md');
    expect(summary).toContain('- API.md');
    expect(summary).toContain('- GUIDE.md');
    expect(summary).toContain('Updated docs:');
    expect(summary).toContain('- CHANGELOG.md');
    expect(summary).toContain('Deleted docs:');
    expect(summary).toContain('- old1.md');
    expect(summary).toContain('- old2.md');
  });

  it('should limit doc details in non-verbose mode', () => {
    const result: CLIDeploymentResult = {
      success: [],
      updated: [],
      noChange: [],
      failures: [],
      excluded: [],
      todos: [],
      docs: {
        created: Array.from({ length: 10 }, (_, i) => `doc${i}.md`),
        updated: [],
        deleted: [],
        failed: [],
        summary: {
          totalDocs: 10,
          createdCount: 10,
          updatedCount: 0,
          deletedCount: 0,
          failedCount: 0,
        },
      },
    };

    const summary = formatDeploymentSummary(result, false, false);

    expect(summary).toContain('10 docs deployed');
    expect(summary).not.toContain('New docs:'); // Details only in verbose
  });

  it('should format mixed results with failures and TODOs', () => {
    const result: CLIDeploymentResult = {
      success: [{ file: 'models/users.yml', modelName: 'users', dataSource: 'postgres' }],
      updated: [{ file: 'models/orders.yml', modelName: 'orders', dataSource: 'postgres' }],
      noChange: [],
      failures: [
        {
          file: 'models/products.yml',
          modelName: 'products',
          errors: ['Invalid type for dimension'],
        },
      ],
      excluded: [{ file: 'models/test.yml', reason: 'Excluded by pattern: **/test.yml' }],
      todos: [{ file: 'models/inventory.yml' }, { file: 'models/shipping.yml' }],
    };

    const summary = formatDeploymentSummary(result);

    expect(summary).toContain('2 models deployed');
    expect(summary).toContain('1 model failed');
    expect(summary).toContain('2 files need completion');
    expect(summary).not.toContain('files excluded'); // excluded only shown in verbose mode
    expect(summary).toContain('✗'); // failure indicator
    expect(summary).toContain('completed with 1 error');
  });

  it('should calculate total errors including doc failures', () => {
    const result: CLIDeploymentResult = {
      success: [],
      updated: [],
      noChange: [],
      failures: [{ file: 'model1.yml', modelName: 'model1', errors: ['Model error'] }],
      excluded: [],
      todos: [],
      docs: {
        created: [],
        updated: [],
        deleted: [],
        failed: [
          { name: 'doc1.md', error: 'Doc error 1' },
          { name: 'doc2.md', error: 'Doc error 2' },
        ],
        summary: {
          createdCount: 0,
          updatedCount: 0,
          deletedCount: 0,
          totalDocs: 0,
          failedCount: 2,
        },
      },
    };

    const summary = formatDeploymentSummary(result, false, false);

    expect(summary).toContain('✗ Deployment completed with 3 errors');
  });

  it('should limit output in non-verbose mode', () => {
    const result: CLIDeploymentResult = {
      success: [],
      updated: [],
      noChange: [],
      failures: Array.from({ length: 10 }, (_, i) => ({
        file: `models/model${i}.yml`,
        modelName: `model${i}`,
        errors: Array.from({ length: 5 }, (_, j) => `Error ${j + 1}`),
      })),
      excluded: [],
      todos: Array.from({ length: 15 }, (_, i) => ({
        file: `models/todo${i}.yml`,
      })),
    };

    const summary = formatDeploymentSummary(result, false);

    // Should show grouped errors with model counts
    expect(summary).toContain('Error 1');
    expect(summary).toContain('Affected models');
    expect(summary).toContain('model0');
    expect(summary).toContain('model4');
    expect(summary).not.toContain('model5'); // Limited to 5 in non-verbose
    expect(summary).toContain('... and 5 more');

    // Should show max 5 TODO files in non-verbose
    expect(summary).toContain('todo0.yml');
    expect(summary).toContain('todo4.yml');
    expect(summary).not.toContain('todo5.yml');
    expect(summary).toContain('... and 10 more');

    // Should show run with verbose hint
    expect(summary).toContain('Run with --verbose for full error details');
  });

  it('should show all details in verbose mode', () => {
    const result: CLIDeploymentResult = {
      success: [],
      updated: [],
      noChange: [],
      failures: Array.from({ length: 10 }, (_, i) => ({
        file: `models/model${i}.yml`,
        modelName: `model${i}`,
        errors: Array.from({ length: 5 }, (_, j) => `Error ${j + 1}`),
      })),
      excluded: [
        { file: 'models/test1.yml', reason: 'Excluded by pattern' },
        { file: 'models/test2.yml', reason: 'In exclude list' },
      ],
      todos: Array.from({ length: 15 }, (_, i) => ({
        file: `models/todo${i}.yml`,
      })),
    };

    const summary = formatDeploymentSummary(result, true, false);

    // Should show all files in verbose mode with full paths
    expect(summary).toContain('models/model0.yml');
    expect(summary).toContain('models/model9.yml');
    expect(summary).not.toContain('... and');

    // Should show all errors
    expect(summary).toContain('Error 5');

    // Should show all TODOs with full paths
    expect(summary).toContain('models/todo14.yml');

    // Should show excluded files in verbose mode
    expect(summary).toContain('2 files excluded:');
    expect(summary).toContain('models/test1.yml: Excluded by pattern');
    expect(summary).toContain('models/test2.yml: In exclude list');
  });
});

describe('mergeDeploymentResults', () => {
  it('should merge multiple deployment results', () => {
    const results: CLIDeploymentResult[] = [
      {
        success: [{ file: 'a.yml', modelName: 'a', dataSource: 'pg' }],
        updated: [{ file: 'b.yml', modelName: 'b', dataSource: 'pg' }],
        noChange: [],
        failures: [],
        excluded: [],
        todos: [{ file: 'todo1.yml' }],
      },
      {
        success: [{ file: 'c.yml', modelName: 'c', dataSource: 'pg' }],
        updated: [],
        noChange: [{ file: 'd.yml', modelName: 'd', dataSource: 'pg' }],
        failures: [{ file: 'e.yml', modelName: 'e', errors: ['error'] }],
        excluded: [{ file: 'f.yml', reason: 'excluded' }],
        todos: [{ file: 'todo2.yml' }],
      },
    ];

    const merged = mergeDeploymentResults(results);

    expect(merged.success).toHaveLength(2);
    expect(merged.updated).toHaveLength(1);
    expect(merged.noChange).toHaveLength(1);
    expect(merged.failures).toHaveLength(1);
    expect(merged.excluded).toHaveLength(1);
    expect(merged.todos).toHaveLength(2);
  });

  it('should merge doc results when present', () => {
    const results: CLIDeploymentResult[] = [
      {
        success: [],
        updated: [],
        noChange: [],
        failures: [],
        excluded: [],
        todos: [],
        docs: {
          created: ['doc1.md'],
          updated: ['doc2.md'],
          deleted: [],
          failed: [],
          summary: {
            totalDocs: 2,
            createdCount: 1,
            updatedCount: 1,
            deletedCount: 0,
            failedCount: 0,
          },
        },
      },
      {
        success: [],
        updated: [],
        noChange: [],
        failures: [],
        excluded: [],
        todos: [],
        docs: {
          created: ['doc3.md'],
          updated: [],
          deleted: ['doc4.md'],
          failed: [{ name: 'doc5.md', error: 'Storage failed' }],
          summary: {
            totalDocs: 1,
            createdCount: 1,
            updatedCount: 0,
            deletedCount: 1,
            failedCount: 1,
          },
        },
      },
    ];

    const merged = mergeDeploymentResults(results);

    expect(merged.docs).toEqual({
      created: ['doc1.md', 'doc3.md'],
      updated: ['doc2.md'],
      deleted: ['doc4.md'],
      failed: [{ name: 'doc5.md', error: 'Storage failed' }],
      summary: {
        totalDocs: 3,
        createdCount: 2,
        updatedCount: 1,
        deletedCount: 1,
        failedCount: 1,
      },
    });
  });

  it('should handle mixed results with and without docs', () => {
    const results: CLIDeploymentResult[] = [
      {
        success: [{ file: 'model1.yml', modelName: 'model1', dataSource: 'pg' }],
        updated: [],
        noChange: [],
        failures: [],
        excluded: [],
        todos: [],
        docs: {
          created: ['doc1.md'],
          updated: [],
          deleted: [],
          failed: [],
          summary: {
            totalDocs: 1,
            createdCount: 1,
            updatedCount: 0,
            deletedCount: 0,
            failedCount: 0,
          },
        },
      },
      {
        success: [{ file: 'model2.yml', modelName: 'model2', dataSource: 'pg' }],
        updated: [],
        noChange: [],
        failures: [],
        excluded: [],
        todos: [],
        // No docs field
      },
    ];

    const merged = mergeDeploymentResults(results);

    expect(merged.success).toHaveLength(2);
    expect(merged.docs).toEqual({
      created: ['doc1.md'],
      updated: [],
      deleted: [],
      failed: [],
      summary: {
        totalDocs: 1,
        createdCount: 1,
        updatedCount: 0,
        deletedCount: 0,
        failedCount: 0,
      },
    });
  });

  it('should handle empty results', () => {
    const merged = mergeDeploymentResults([]);

    expect(merged.success).toHaveLength(0);
    expect(merged.updated).toHaveLength(0);
    expect(merged.noChange).toHaveLength(0);
    expect(merged.failures).toHaveLength(0);
    expect(merged.excluded).toHaveLength(0);
    expect(merged.todos).toHaveLength(0);
    expect(merged.docs).toBeUndefined();
  });
});

describe('processDeploymentResponse', () => {
  it('should process deployment response into CLI result format', () => {
    const response = {
      models: {
        success: [
          { name: 'users', dataSource: 'postgres' },
          { name: 'orders', dataSource: 'postgres' },
        ],
        updated: [{ name: 'products', dataSource: 'postgres' }],
        failures: [{ name: 'inventory', errors: ['Error 1', 'Error 2'] }],
        deleted: [],
        summary: {
          totalModels: 5,
          successCount: 2,
          updateCount: 1,
          failureCount: 1,
          deletedCount: 0,
        },
      },
      docs: {
        created: [],
        updated: [],
        deleted: [],
        failed: [],
        summary: {
          totalDocs: 0,
          createdCount: 0,
          updatedCount: 0,
          deletedCount: 0,
          failedCount: 0,
        },
      },
    };

    const modelFileMap = new Map([
      ['users', 'models/users.yml'],
      ['orders', 'models/orders.yml'],
      ['products', 'models/products.yml'],
      ['customers', 'models/customers.yml'],
      ['inventory', 'models/inventory.yml'],
    ]);

    const docFileMap = new Map<string, string>();

    const result = processDeploymentResponse(response, modelFileMap, docFileMap);

    expect(result.success).toHaveLength(2);
    expect(result.success[0]).toEqual({
      file: 'models/users.yml',
      modelName: 'users',
      dataSource: 'postgres',
    });

    expect(result.updated).toHaveLength(1);
    expect(result.updated[0]).toEqual({
      file: 'models/products.yml',
      modelName: 'products',
      dataSource: 'postgres',
    });

    expect(result.noChange).toHaveLength(0);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]).toEqual({
      file: 'models/inventory.yml',
      modelName: 'inventory',
      errors: ['Error 1', 'Error 2'],
    });

    expect(result.docs).toEqual({
      created: [],
      updated: [],
      deleted: [],
      failed: [],
      summary: {
        totalDocs: 0,
        createdCount: 0,
        updatedCount: 0,
        deletedCount: 0,
        failedCount: 0,
      },
    });
  });

  it('should process doc deployment results', () => {
    const response = {
      models: {
        success: [],
        updated: [],
        failures: [],
        deleted: [],
        summary: {
          totalModels: 0,
          successCount: 0,
          updateCount: 0,
          failureCount: 0,
          deletedCount: 0,
        },
      },
      docs: {
        created: ['README.md', 'API.md'],
        updated: ['CHANGELOG.md'],
        deleted: ['deprecated.md'],
        failed: [
          { name: 'failed.md', error: 'Storage error' },
          { name: 'another-failed.md', error: 'Permission denied' },
        ],
        summary: {
          totalDocs: 5,
          createdCount: 2,
          updatedCount: 1,
          deletedCount: 1,
          failedCount: 2,
        },
      },
    };

    const modelFileMap = new Map<string, string>();
    const docFileMap = new Map<string, string>();

    const result = processDeploymentResponse(response, modelFileMap, docFileMap);

    expect(result.docs).toEqual({
      created: ['README.md', 'API.md'],
      updated: ['CHANGELOG.md'],
      deleted: ['deprecated.md'],
      failed: [
        { name: 'failed.md', error: 'Storage error' },
        { name: 'another-failed.md', error: 'Permission denied' },
      ],
      summary: {
        totalDocs: 5,
        createdCount: 2,
        updatedCount: 1,
        deletedCount: 1,
        failedCount: 2,
      },
    });
  });

  it('should handle missing model or doc data gracefully', () => {
    const response = {
      models: {
        success: [{ name: 'test', dataSource: 'pg' }],
        updated: [],
        failures: [],
        deleted: [],
        summary: {
          totalModels: 1,
          successCount: 1,
          updateCount: 0,
          failureCount: 0,
          deletedCount: 0,
        },
      },
      // docs field missing
    } as any;

    const modelFileMap = new Map([['test', 'test.yml']]);
    const docFileMap = new Map<string, string>();

    const result = processDeploymentResponse(response, modelFileMap, docFileMap);

    expect(result.success).toHaveLength(1);
    expect(result.docs).toBeUndefined();
  });
});

describe('createModelFileMap', () => {
  it('should create mapping from model names to file paths', () => {
    const fileModels = [
      {
        file: 'models/users.yml',
        models: [{ name: 'users', data_source_name: 'pg' } as any],
      },
      {
        file: 'models/orders.yml',
        models: [
          { name: 'orders', data_source_name: 'pg' } as any,
          { name: 'order_items', data_source_name: 'pg' } as any,
        ],
      },
    ];

    const map = createModelFileMap(fileModels);

    expect(map.get('users')).toBe('models/users.yml');
    expect(map.get('orders')).toBe('models/orders.yml');
    expect(map.get('order_items')).toBe('models/orders.yml');
    expect(map.get('nonexistent')).toBeUndefined();
  });
});

describe('createParseFailures', () => {
  it('should convert parse failures to CLI deployment failures', () => {
    const failures = [
      { file: '/project/models/users.yml', error: 'Invalid YAML' },
      { file: 'orders.yml', error: 'Missing name field' },
    ];

    const result = createParseFailures(failures, '/project');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      file: 'models/users.yml',
      modelName: 'parse_error',
      errors: ['Invalid YAML'],
    });
    // The second file has no path separator, so it's returned as-is
    expect(result[1]).toEqual({
      file: 'orders.yml',
      modelName: 'parse_error',
      errors: ['Missing name field'],
    });
  });
});
