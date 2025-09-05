import type { DeployModel } from '@buster/server-shared';
import { describe, expect, it } from 'vitest';
import { isModelValid, validateModel } from './validate-model';

describe('validateModel', () => {
  it('should return no errors for a valid model', () => {
    const model: DeployModel = {
      name: 'users',
      data_source_name: 'postgres_main',
      schema: 'public',
      database: 'analytics',
      description: 'Users table',
      columns: [
        {
          name: 'id',
          description: 'User ID',
          searchable: true,
          type: 'string',
          expr: 'id',
        },
        {
          name: 'email',
          description: 'User email',
          searchable: true,
          type: 'string',
          expr: 'email',
        },
      ],
    };

    const errors = validateModel(model);
    expect(errors).toHaveLength(0);
    expect(isModelValid(model)).toBe(true);
  });

  it('should return error for missing model name', () => {
    const model = {
      name: '',
      data_source_name: 'postgres_main',
      schema: 'public',
      description: 'Test',
      columns: [{ name: 'id', description: 'ID', searchable: true, type: 'string', expr: 'id' }],
    } as DeployModel;

    const errors = validateModel(model);
    expect(errors).toContain('Model name is required');
    expect(isModelValid(model)).toBe(false);
  });

  it('should return error for missing data source name', () => {
    const model = {
      name: 'users',
      data_source_name: '',
      schema: 'public',
      description: 'Test',
      columns: [{ name: 'id', description: 'ID', searchable: true, type: 'string', expr: 'id' }],
    } as DeployModel;

    const errors = validateModel(model);
    expect(errors).toContain('Data source name is required');
  });

  it('should return error for missing schema', () => {
    const model = {
      name: 'users',
      data_source_name: 'postgres_main',
      schema: '',
      description: 'Test',
      columns: [{ name: 'id', description: 'ID', searchable: true, type: 'string', expr: 'id' }],
    } as DeployModel;

    const errors = validateModel(model);
    expect(errors).toContain('Schema is required');
  });

  it('should return error for empty columns array', () => {
    const model = {
      name: 'users',
      data_source_name: 'postgres_main',
      schema: 'public',
      description: 'Test',
      columns: [],
    } as DeployModel;

    const errors = validateModel(model);
    expect(errors).toContain('Model must have at least one column');
  });

  it('should return error for duplicate column names', () => {
    const model = {
      name: 'users',
      data_source_name: 'postgres_main',
      schema: 'public',
      description: 'Test',
      columns: [
        { name: 'id', description: 'ID', searchable: true, type: 'string', expr: 'id' },
        { name: 'id', description: 'ID2', searchable: true, type: 'number', expr: 'id' },
      ],
    } as DeployModel;

    const errors = validateModel(model);
    expect(errors).toContain('Duplicate column name: id');
  });

  it('should return error for column with empty name', () => {
    const model = {
      name: 'users',
      data_source_name: 'postgres_main',
      schema: 'public',
      description: 'Test',
      columns: [{ name: '', description: 'ID', searchable: true, type: 'string', expr: 'id' }],
    } as DeployModel;

    const errors = validateModel(model);
    expect(errors).toContain('Column name is required');
  });

  it('should return multiple errors for multiple issues', () => {
    const model = {
      name: '',
      data_source_name: '',
      schema: '',
      description: 'Test',
      columns: [],
    } as DeployModel;

    const errors = validateModel(model);
    expect(errors).toContain('Model name is required');
    expect(errors).toContain('Data source name is required');
    expect(errors).toContain('Schema is required');
    expect(errors).toContain('Model must have at least one column');
    expect(errors.length).toBe(4);
  });
});
