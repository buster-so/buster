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
    expect(summary).toContain('1 models failed');
    expect(summary).toContain('2 files need completion');
    expect(summary).not.toContain('files excluded'); // excluded only shown in verbose mode
    expect(summary).toContain('✗'); // failure indicator
    expect(summary).toContain('completed with 1 error');
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

  it('should handle empty results', () => {
    const merged = mergeDeploymentResults([]);

    expect(merged.success).toHaveLength(0);
    expect(merged.updated).toHaveLength(0);
    expect(merged.noChange).toHaveLength(0);
    expect(merged.failures).toHaveLength(0);
    expect(merged.excluded).toHaveLength(0);
    expect(merged.todos).toHaveLength(0);
  });
});

describe('processDeploymentResponse', () => {
  it('should process deployment response into CLI result format', () => {
    const response = {
      success: [
        { name: 'users', dataSource: 'postgres' },
        { name: 'orders', dataSource: 'postgres' },
      ],
      updated: [{ name: 'products', dataSource: 'postgres' }],
      noChange: [{ name: 'customers', dataSource: 'postgres' }],
      failures: [{ name: 'inventory', errors: ['Error 1', 'Error 2'] }],
      deleted: [],
    };

    const modelFileMap = new Map([
      ['users', 'models/users.yml'],
      ['orders', 'models/orders.yml'],
      ['products', 'models/products.yml'],
      ['customers', 'models/customers.yml'],
      ['inventory', 'models/inventory.yml'],
    ]);

    const result = processDeploymentResponse(response, modelFileMap);

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

    expect(result.noChange).toHaveLength(1);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]).toEqual({
      file: 'models/inventory.yml',
      modelName: 'inventory',
      errors: ['Error 1', 'Error 2'],
    });
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
