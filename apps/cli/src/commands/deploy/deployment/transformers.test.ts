import type { deploy } from '@buster/server-shared';
import { describe, expect, it } from 'vitest';
import type { Model } from '../schemas';
import {
  batchModelsByDataSource,
  createModelFileMap,
  dimensionsToColumns,
  measuresToColumns,
  modelToDeployModel,
  prepareDeploymentRequest,
  validateModelsForDeployment,
} from './transformers';

type DeployDoc = deploy.DeployDoc;

describe('transformers', () => {
  describe('prepareDeploymentRequest', () => {
    it('should create deployment request from models', () => {
      const models: Model[] = [
        {
          name: 'users',
          data_source_name: 'postgres',
          schema: 'public',
          database: 'analytics',
          dimensions: [],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
          clarifications: [],
        },
      ];

      const result = prepareDeploymentRequest(models);

      expect(result).toEqual({
        models: expect.arrayContaining([
          expect.objectContaining({
            name: 'users',
            data_source_name: 'postgres',
            schema: 'public',
          }),
        ]),
        docs: [],
        deleteAbsentModels: true,
        deleteAbsentDocs: true,
      });
    });

    it('should respect deleteAbsentModels parameter', () => {
      const models: Model[] = [];
      const result = prepareDeploymentRequest(models, [], false);

      expect(result.deleteAbsentModels).toBe(false);
    });

    it('should include docs in deployment request', () => {
      const models: Model[] = [];
      const docs: DeployDoc[] = [
        {
          name: 'README.md',
          content: '# Documentation',
          type: 'normal',
        },
        {
          name: 'ANALYST.md',
          content: '# Analyst Guide',
          type: 'analyst',
        },
      ];

      const result = prepareDeploymentRequest(models, docs);

      expect(result.docs).toEqual(docs);
      expect(result.docs).toHaveLength(2);
    });

    it('should respect deleteAbsentDocs parameter', () => {
      const models: Model[] = [];
      const docs: DeployDoc[] = [];
      const result = prepareDeploymentRequest(models, docs, true, false);

      expect(result.deleteAbsentDocs).toBe(false);
      expect(result.deleteAbsentModels).toBe(true);
    });

    it('should handle complete deployment request with models and docs', () => {
      const models: Model[] = [
        {
          name: 'users',
          data_source_name: 'postgres',
          schema: 'public',
          database: 'analytics',
          dimensions: [{ name: 'id', searchable: true }],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
          clarifications: [],
        },
      ];

      const docs: DeployDoc[] = [
        {
          name: 'users.md',
          content: '# Users Model Documentation',
          type: 'normal',
        },
      ];

      const result = prepareDeploymentRequest(models, docs, false, false);

      expect(result.models).toHaveLength(1);
      expect(result.docs).toEqual(docs);
      expect(result.deleteAbsentModels).toBe(false);
      expect(result.deleteAbsentDocs).toBe(false);
    });

    it('should default docs to empty array', () => {
      const models: Model[] = [];
      const result = prepareDeploymentRequest(models);

      expect(result.docs).toEqual([]);
      expect(result.deleteAbsentModels).toBe(true);
      expect(result.deleteAbsentDocs).toBe(true);
    });
  });

  describe('dimensionsToColumns', () => {
    it('should transform dimensions to deploy columns', () => {
      const dimensions = [
        {
          name: 'user_id',
          description: 'User identifier',
          type: 'string',
          searchable: true,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          searchable: false,
        },
      ];

      const result = dimensionsToColumns(dimensions);

      expect(result).toEqual([
        {
          name: 'user_id',
          description: 'User identifier',
          semantic_type: 'dimension',
          type: 'string',
          searchable: true,
          expr: undefined,
          agg: undefined,
        },
        {
          name: 'created_at',
          description: '',
          semantic_type: 'dimension',
          type: 'timestamp',
          searchable: false,
          expr: undefined,
          agg: undefined,
        },
      ]);
    });
  });

  describe('measuresToColumns', () => {
    it('should transform measures to deploy columns', () => {
      const measures = [
        {
          name: 'total_revenue',
          description: 'Total revenue',
          type: 'number',
        },
        {
          name: 'user_count',
          type: 'integer',
        },
      ];

      const result = measuresToColumns(measures);

      expect(result).toEqual([
        {
          name: 'total_revenue',
          description: 'Total revenue',
          semantic_type: 'measure',
          type: 'number',
          searchable: false,
          expr: undefined,
          agg: undefined,
        },
        {
          name: 'user_count',
          description: '',
          semantic_type: 'measure',
          type: 'integer',
          searchable: false,
          expr: undefined,
          agg: undefined,
        },
      ]);
    });
  });

  describe('createModelFileMap', () => {
    it('should create mapping from model names to file paths', () => {
      const modelFiles = [
        {
          file: 'models/users.yml',
          models: [{ name: 'users' } as Model, { name: 'user_sessions' } as Model],
        },
        {
          file: 'models/orders.yml',
          models: [{ name: 'orders' } as Model],
        },
      ];

      const result = createModelFileMap(modelFiles);

      expect(result.get('users')).toBe('models/users.yml');
      expect(result.get('user_sessions')).toBe('models/users.yml');
      expect(result.get('orders')).toBe('models/orders.yml');
      expect(result.size).toBe(3);
    });
  });

  describe('validateModelsForDeployment', () => {
    it('should separate valid and invalid models', () => {
      const models: Model[] = [
        {
          name: 'valid_model',
          data_source_name: 'postgres',
          schema: 'public',
          dimensions: [{ name: 'id', searchable: false }],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
        },
        {
          name: '',
          data_source_name: 'postgres',
          schema: 'public',
          dimensions: [],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
        },
        {
          name: 'missing_schema',
          data_source_name: 'postgres',
          dimensions: [],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
        } as any,
      ];

      const { valid, invalid } = validateModelsForDeployment(models);

      expect(valid).toHaveLength(1);
      expect(valid[0]?.name).toBe('valid_model');

      expect(invalid).toHaveLength(2);
      expect(invalid[0]?.errors).toContain('Model name is required');
      expect(invalid[1]?.errors).toContain('schema is required');
    });

    it('should require at least one dimension or measure', () => {
      const model: Model = {
        name: 'empty_model',
        data_source_name: 'postgres',
        schema: 'public',
        dimensions: [],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
        clarifications: [],
      };

      const { valid, invalid } = validateModelsForDeployment([model]);

      expect(valid).toHaveLength(0);
      expect(invalid).toHaveLength(1);
      expect(invalid[0]?.errors).toContain('Model must have at least one dimension or measure');
    });
  });

  describe('batchModelsByDataSource', () => {
    it('should group models by data source and schema', () => {
      const models: Model[] = [
        {
          name: 'users',
          data_source_name: 'postgres',
          schema: 'public',
          dimensions: [],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
          clarifications: [],
        },
        {
          name: 'orders',
          data_source_name: 'postgres',
          schema: 'public',
          dimensions: [],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
          clarifications: [],
        },
        {
          name: 'analytics',
          data_source_name: 'bigquery',
          schema: 'reporting',
          dimensions: [],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
          clarifications: [],
        },
      ];

      const result = batchModelsByDataSource(models);

      expect(result.size).toBe(2);
      expect(result.get('postgres:public')).toHaveLength(2);
      expect(result.get('bigquery:reporting')).toHaveLength(1);
    });

    it('should handle missing data source or schema', () => {
      const models: Model[] = [
        {
          name: 'model1',
          dimensions: [],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
        } as any,
      ];

      const result = batchModelsByDataSource(models);

      expect(result.size).toBe(1);
      expect(result.has('unknown:unknown')).toBe(true);
    });
  });

  describe('modelToDeployModel', () => {
    it('should throw error if required fields are missing', () => {
      const model: Model = {
        name: 'test',
        dimensions: [],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
      } as any;

      expect(() => modelToDeployModel(model)).toThrow('data_source_name');
    });

    it('should transform complete model successfully', () => {
      const model: Model = {
        name: 'users',
        description: 'User table',
        data_source_name: 'postgres',
        database: 'analytics',
        schema: 'public',
        dimensions: [{ name: 'id', searchable: true }],
        measures: [{ name: 'count' }],
        metrics: [],
        filters: [],
        relationships: [],
        clarifications: [],
      };

      const result = modelToDeployModel(model);

      expect(result.name).toBe('users');
      expect(result.description).toBe('User table');
      expect(result.data_source_name).toBe('postgres');
      expect(result.database).toBe('analytics');
      expect(result.schema).toBe('public');
      expect(result.columns).toHaveLength(2);
      expect(result.yml_file).toContain('name: users');
      expect(result.sql_definition).toContain('SELECT * FROM');
    });
  });
});
