import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Model } from '../schemas';
import {
  fileContainsTodo,
  findTodoMarkers,
  formatZodIssues,
  generateDefaultSQL,
  ModelParsingError,
  parseModelFile,
  parseModelFileStrict,
  resolveModelConfig,
  validateModel,
} from './parsing';

describe('parsing', () => {
  let testDir: string;

  beforeEach(async () => {
    const testId = Math.random().toString(36).substring(7);
    testDir = join(tmpdir(), `buster-cli-test-${testId}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('resolveModelConfig', () => {
    describe('cascading configuration', () => {
      const baseConfig = {
        data_source_name: 'global_postgres',
        database: 'global_db',
        schema: 'global_schema',
      };

      it('should use global config values when model values are undefined', () => {
        const model: Model = {
          name: 'test_model',
          dimensions: [{ name: 'id', searchable: false }],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
          clarifications: [],
        };

        const resolved = resolveModelConfig(model, baseConfig);

        expect(resolved.data_source_name).toBe('global_postgres');
        expect(resolved.database).toBe('global_db');
        expect(resolved.schema).toBe('global_schema');
      });

      it('should use model values when they override global config', () => {
        const model: Model = {
          name: 'test_model',
          data_source_name: 'model_mysql',
          database: 'model_db',
          schema: 'model_schema',
          dimensions: [{ name: 'id', searchable: false }],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
          clarifications: [],
        };

        const resolved = resolveModelConfig(model, baseConfig);

        expect(resolved.data_source_name).toBe('model_mysql');
        expect(resolved.database).toBe('model_db');
        expect(resolved.schema).toBe('model_schema');
      });

      it('should handle partial overrides - only data_source_name', () => {
        const model: Model = {
          name: 'test_model',
          data_source_name: 'model_bigquery',
          dimensions: [{ name: 'id', searchable: false }],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
          clarifications: [],
        };

        const resolved = resolveModelConfig(model, baseConfig);

        expect(resolved.data_source_name).toBe('model_bigquery');
        expect(resolved.database).toBe('global_db');
        expect(resolved.schema).toBe('global_schema');
      });

      it('should handle partial overrides - only database', () => {
        const model: Model = {
          name: 'test_model',
          database: 'model_specific_db',
          dimensions: [{ name: 'id', searchable: false }],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
          clarifications: [],
        };

        const resolved = resolveModelConfig(model, baseConfig);

        expect(resolved.data_source_name).toBe('global_postgres');
        expect(resolved.database).toBe('model_specific_db');
        expect(resolved.schema).toBe('global_schema');
      });

      it('should handle partial overrides - only schema', () => {
        const model: Model = {
          name: 'test_model',
          schema: 'model_specific_schema',
          dimensions: [{ name: 'id', searchable: false }],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
          clarifications: [],
        };

        const resolved = resolveModelConfig(model, baseConfig);

        expect(resolved.data_source_name).toBe('global_postgres');
        expect(resolved.database).toBe('global_db');
        expect(resolved.schema).toBe('model_specific_schema');
      });

      it('should handle mixed overrides - data_source and schema', () => {
        const model: Model = {
          name: 'test_model',
          data_source_name: 'model_snowflake',
          schema: 'model_warehouse',
          dimensions: [{ name: 'id', searchable: false }],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
          clarifications: [],
        };

        const resolved = resolveModelConfig(model, baseConfig);

        expect(resolved.data_source_name).toBe('model_snowflake');
        expect(resolved.database).toBe('global_db');
        expect(resolved.schema).toBe('model_warehouse');
      });

      it('should handle empty config object', () => {
        const model: Model = {
          name: 'test_model',
          data_source_name: 'model_postgres',
          database: 'model_db',
          schema: 'model_schema',
          dimensions: [{ name: 'id', searchable: false }],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
          clarifications: [],
        };

        const resolved = resolveModelConfig(model, {});

        expect(resolved.data_source_name).toBe('model_postgres');
        expect(resolved.database).toBe('model_db');
        expect(resolved.schema).toBe('model_schema');
      });

      it('should handle undefined values in config', () => {
        const model: Model = {
          name: 'test_model',
          dimensions: [{ name: 'id', searchable: false }],
          measures: [],
          metrics: [],
          filters: [],
          relationships: [],
          clarifications: [],
        };

        const partialConfig = {
          data_source_name: 'config_postgres',
          database: undefined,
          schema: undefined,
        };

        const resolved = resolveModelConfig(model, partialConfig);

        expect(resolved.data_source_name).toBe('config_postgres');
        expect(resolved.database).toBeUndefined();
        expect(resolved.schema).toBeUndefined();
      });

      it('should preserve other model properties during resolution', () => {
        const model: Model = {
          name: 'test_model',
          description: 'Test model description',
          dimensions: [
            { name: 'id', searchable: false },
            { name: 'name', searchable: true, type: 'string' },
          ],
          measures: [{ name: 'count', type: 'integer' }],
          metrics: [{ name: 'total', expr: 'sum(count)', args: [] }],
          filters: [{ name: 'active', expr: 'status = "active"', args: [] }],
          relationships: [{ name: 'user_rel', source_col: 'user_id', ref_col: 'users.id' }],
          clarifications: [],
        };

        const resolved = resolveModelConfig(model, baseConfig);

        expect(resolved.name).toBe('test_model');
        expect(resolved.description).toBe('Test model description');
        expect(resolved.dimensions).toEqual(model.dimensions);
        expect(resolved.measures).toEqual(model.measures);
        expect(resolved.metrics).toEqual(model.metrics);
        expect(resolved.filters).toEqual(model.filters);
        expect(resolved.relationships).toEqual(model.relationships);
      });

      it('should handle multiple models with different override patterns', () => {
        const models: Model[] = [
          {
            name: 'model1',
            dimensions: [{ name: 'id', searchable: false }],
            measures: [],
            metrics: [],
            filters: [],
            relationships: [],
            clarifications: [],
          },
          {
            name: 'model2',
            data_source_name: 'custom_source',
            dimensions: [{ name: 'id', searchable: false }],
            measures: [],
            metrics: [],
            filters: [],
            relationships: [],
            clarifications: [],
          },
          {
            name: 'model3',
            database: 'custom_db',
            schema: 'custom_schema',
            dimensions: [{ name: 'id', searchable: false }],
            measures: [],
            metrics: [],
            filters: [],
            relationships: [],
            clarifications: [],
          },
        ];

        const resolved = models.map((m) => resolveModelConfig(m, baseConfig));

        // Model 1: inherits all from global
        expect(resolved[0]?.data_source_name).toBe('global_postgres');
        expect(resolved[0]?.database).toBe('global_db');
        expect(resolved[0]?.schema).toBe('global_schema');

        // Model 2: overrides data_source, inherits others
        expect(resolved[1]?.data_source_name).toBe('custom_source');
        expect(resolved[1]?.database).toBe('global_db');
        expect(resolved[1]?.schema).toBe('global_schema');

        // Model 3: overrides database and schema, inherits data_source
        expect(resolved[2]?.data_source_name).toBe('global_postgres');
        expect(resolved[2]?.database).toBe('custom_db');
        expect(resolved[2]?.schema).toBe('custom_schema');
      });
    });
  });

  describe('parseModelFile', () => {
    it('should parse a single model file', async () => {
      const model = {
        name: 'users',
        description: 'User model',
        data_source_name: 'postgres',
        schema: 'public',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [{ name: 'count' }],
      };

      const filePath = join(testDir, 'users.yml');
      await writeFile(filePath, yaml.dump(model));

      const result = await parseModelFile(filePath);

      expect(result.models).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.models[0]?.name).toBe('users');
      expect(result.models[0]?.description).toBe('User model');
      expect(result.models[0]?.dimensions).toHaveLength(1);
      expect(result.models[0]?.measures).toHaveLength(1);
    });

    it('should only parse single model files (no models key)', async () => {
      // Files with 'models' key should be rejected
      const multiModel = {
        models: [
          {
            name: 'users',
            dimensions: [{ name: 'id', searchable: false }],
            measures: [],
          },
        ],
      };

      const filePath = join(testDir, 'models.yml');
      await writeFile(filePath, yaml.dump(multiModel));

      const result = await parseModelFile(filePath);

      // Should fail to parse because it has a 'models' key
      expect(result.models).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should throw ModelParsingError for invalid YAML', async () => {
      const filePath = join(testDir, 'invalid.yml');
      await writeFile(filePath, 'invalid: yaml: content: :::');

      // parseModelFile itself doesn't throw for invalid YAML structure,
      // but parseModelFileStrict does
      await expect(parseModelFile(filePath)).rejects.toThrow(ModelParsingError);
    });

    it('should return validation errors for invalid model structure', async () => {
      const invalidModel = {
        // Missing required 'name' field
        dimensions: 'not an array',
      };

      const filePath = join(testDir, 'invalid-model.yml');
      await writeFile(filePath, yaml.dump(invalidModel));

      const result = await parseModelFile(filePath);

      expect(result.models).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.issues.length).toBeGreaterThan(0);

      // Check that we get specific validation issues
      const allIssues = result.errors.flatMap((e) => formatZodIssues(e.issues));
      expect(allIssues.some((issue) => issue.includes('name'))).toBe(true);
    });

    it('should return multiple validation errors for multiple invalid fields', async () => {
      const invalidModel = {
        name: 123, // Should be string
        dimensions: 'not an array', // Should be array
        measures: { invalid: 'object' }, // Should be array
      };

      const filePath = join(testDir, 'multi-error-model.yml');
      await writeFile(filePath, yaml.dump(invalidModel));

      const result = await parseModelFile(filePath);

      expect(result.models).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);

      // Should capture errors for all invalid fields
      const allIssues = result.errors.flatMap((e) => formatZodIssues(e.issues));
      expect(allIssues.some((issue) => issue.includes('name'))).toBe(true);
      expect(allIssues.some((issue) => issue.includes('dimensions'))).toBe(true);
      expect(allIssues.some((issue) => issue.includes('measures'))).toBe(true);
    });

    it('should throw ModelParsingError for empty file', async () => {
      const filePath = join(testDir, 'empty.yml');
      await writeFile(filePath, '');

      await expect(parseModelFile(filePath)).rejects.toThrow('Invalid YAML structure');
    });

    it('should include file path in error message for parseModelFileStrict', async () => {
      const filePath = join(testDir, 'error.yml');
      await writeFile(filePath, 'null');

      try {
        await parseModelFileStrict(filePath);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ModelParsingError);
        expect((error as ModelParsingError).file).toBe(filePath);
        expect((error as ModelParsingError).getDetailedMessage()).toContain(filePath);
      }
    });

    it('should parse each file as a single model only', async () => {
      // Test that we can parse a valid single model
      const singleModel = {
        name: 'valid_model',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [{ name: 'count' }],
      };

      const filePath = join(testDir, 'single-model.yml');
      await writeFile(filePath, yaml.dump(singleModel));

      const result = await parseModelFile(filePath);

      expect(result.models).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.models[0]?.name).toBe('valid_model');
      expect(result.models[0]?.dimensions).toHaveLength(1);
      expect(result.models[0]?.measures).toHaveLength(1);
    });

    it('should collect ALL Zod validation errors at once, not just the first', async () => {
      // Create a model with multiple Zod schema violations
      const invalidModel = {
        name: 12345, // Should be string
        description: null, // Should be string or undefined
        dimensions: 'not_an_array', // Should be array
        measures: { invalid: 'object' }, // Should be array
        metrics: 'also_not_array', // Should be array
        filters: 123, // Should be array
        relationships: true, // Should be array
      };

      const filePath = join(testDir, 'multiple-zod-errors.yml');
      await writeFile(filePath, yaml.dump(invalidModel));

      const result = await parseModelFile(filePath);

      expect(result.models).toHaveLength(0);
      expect(result.errors).toHaveLength(1); // One error group for the single model

      const allIssues = result.errors.flatMap((e) => formatZodIssues(e.issues));

      // Should have collected ALL schema violations, not just the first one
      expect(allIssues.length).toBeGreaterThanOrEqual(5); // At least 5 field errors
      expect(allIssues.some((issue) => issue.includes('name'))).toBe(true);
      expect(allIssues.some((issue) => issue.includes('dimensions'))).toBe(true);
      expect(allIssues.some((issue) => issue.includes('measures'))).toBe(true);
      expect(allIssues.some((issue) => issue.includes('metrics'))).toBe(true);
      expect(allIssues.some((issue) => issue.includes('filters'))).toBe(true);
    });

    it('should provide detailed Zod error messages with field paths', async () => {
      const invalidModel = {
        name: 'test',
        dimensions: [
          { name: 'valid_dim', searchable: false },
          { name: 123, searchable: 'not_boolean' }, // Invalid dimension
        ],
        measures: [
          { name: 'valid_measure' },
          { invalid_field: 'test' }, // Missing name field
        ],
      };

      const filePath = join(testDir, 'detailed-errors.yml');
      await writeFile(filePath, yaml.dump(invalidModel));

      const result = await parseModelFile(filePath);

      expect(result.models).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);

      const allIssues = result.errors.flatMap((e) => formatZodIssues(e.issues));

      // Check that we get specific path information in errors
      const hasPathInfo = allIssues.some(
        (issue) => issue.includes('dimensions') || issue.includes('measures')
      );
      expect(hasPathInfo).toBe(true);
    });

    it('should handle models with only some invalid fields gracefully', async () => {
      const partiallyInvalidModel = {
        name: 'partial_model',
        description: 'Valid description',
        dimensions: [{ name: 'id', searchable: false }],
        measures: 'invalid_measures', // This field is invalid
        metrics: [], // Valid empty array
        filters: [], // Valid empty array
        relationships: [], // Valid empty array
      };

      const filePath = join(testDir, 'partial-invalid.yml');
      await writeFile(filePath, yaml.dump(partiallyInvalidModel));

      const result = await parseModelFile(filePath);

      expect(result.models).toHaveLength(0); // Model is invalid
      expect(result.errors.length).toBeGreaterThan(0);

      const allIssues = result.errors.flatMap((e) => formatZodIssues(e.issues));

      // Should only report errors for invalid fields
      expect(allIssues.some((issue) => issue.includes('measures'))).toBe(true);
      // Should not have errors for valid fields
      expect(allIssues.some((issue) => issue.includes('dimensions'))).toBe(false);
    });
  });

  describe('validateModel', () => {
    it('should validate a valid model', () => {
      const model: Model = {
        name: 'valid_model',
        data_source_name: 'postgres',
        schema: 'public',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [{ name: 'count' }],
        metrics: [],
        filters: [],
        relationships: [],
        clarifications: [],
      };

      const result = validateModel(model);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require model name', () => {
      const model: Model = {
        name: '',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
        clarifications: [],
      };

      const result = validateModel(model);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Model name is required');
    });

    it('should require at least one dimension or measure', () => {
      const model: Model = {
        name: 'empty_model',
        dimensions: [],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
        clarifications: [],
      };

      const result = validateModel(model);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Model must have at least one dimension or measure');
    });

    // Note: Duplicate name validation is now handled by ModelSchema
    // These tests have been moved to schemas.test.ts

    it('should require metric expressions', () => {
      const model: Model = {
        name: 'test',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [],
        metrics: [{ name: 'empty_metric', expr: '', args: [] }],
        filters: [],
        relationships: [],
        clarifications: [],
      };

      const result = validateModel(model);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Metric empty_metric must have an expression');
    });

    it('should require filter expressions', () => {
      const model: Model = {
        name: 'test',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [],
        metrics: [],
        filters: [{ name: 'empty_filter', expr: '', args: [] }],
        relationships: [],
        clarifications: [],
      };

      const result = validateModel(model);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Filter empty_filter must have an expression');
    });

    it('should validate relationship columns', () => {
      const model: Model = {
        name: 'test',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [{ name: 'incomplete', source_col: '', ref_col: 'users.id' }],
        clarifications: [],
      };

      const result = validateModel(model);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Relationship incomplete must have source_col and ref_col');
    });

    it('should return multiple errors for multiple issues', () => {
      const model: Model = {
        name: '',
        dimensions: [],
        measures: [],
        metrics: [{ name: 'metric1', expr: '', args: [] }],
        filters: [
          { name: 'filter1', expr: 'valid', args: [] },
          { name: 'filter2', expr: '', args: [] }, // Changed to test empty expression instead of duplicate
        ],
        relationships: [],
        clarifications: [],
      };

      const result = validateModel(model);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
      expect(result.errors).toContain('Model name is required');
      expect(result.errors).toContain('Model must have at least one dimension or measure');
      expect(result.errors).toContain('Metric metric1 must have an expression');
      expect(result.errors).toContain('Filter filter2 must have an expression');
    });
  });

  describe('findTodoMarkers', () => {
    it('should detect TODO markers in model description', () => {
      const model: Model = {
        name: 'test',
        description: 'This model has a {{TODO}} marker in description',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
        clarifications: [],
      };

      const todos = findTodoMarkers(model);
      expect(todos).toContain('description contains {{TODO}}');
    });

    it('should detect TODO markers in dimension fields', () => {
      const model: Model = {
        name: 'test',
        dimensions: [
          {
            name: 'status',
            description: 'Status field {{TODO}} add more detail',
            type: 'string',
            searchable: false,
          },
          {
            name: 'type',
            type: '{{TODO}}',
            searchable: false,
          },
          {
            name: 'category',
            options: ['active', '{{TODO}}', 'pending'],
            searchable: false,
          },
        ],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
        clarifications: [],
      };

      const todos = findTodoMarkers(model);
      expect(todos).toContain("dimension 'status' description contains {{TODO}}");
      expect(todos).toContain("dimension 'type' type contains {{TODO}}");
      expect(todos).toContain("dimension 'category' options contains {{TODO}}");
    });

    it('should detect TODO markers in measures', () => {
      const model: Model = {
        name: 'test',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [
          {
            name: 'total',
            description: '{{TODO}} calculate properly',
            type: 'numeric',
          },
          {
            name: 'count',
            type: '{{TODO}}',
          },
        ],
        metrics: [],
        filters: [],
        relationships: [],
        clarifications: [],
      };

      const todos = findTodoMarkers(model);
      expect(todos).toContain("measure 'total' description contains {{TODO}}");
      expect(todos).toContain("measure 'count' type contains {{TODO}}");
    });

    it('should detect TODO markers in metrics and filters', () => {
      const model: Model = {
        name: 'test',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [],
        metrics: [
          {
            name: 'metric1',
            expr: 'sum({{TODO}})',
            description: 'Metric {{TODO}}',
            args: [],
          },
        ],
        filters: [
          {
            name: 'filter1',
            expr: 'status = {{TODO}}',
            description: '{{TODO}} add description',
            args: [],
          },
        ],
        relationships: [],
        clarifications: [],
      };

      const todos = findTodoMarkers(model);
      expect(todos).toContain("metric 'metric1' description contains {{TODO}}");
      expect(todos).toContain("metric 'metric1' expression contains {{TODO}}");
      expect(todos).toContain("filter 'filter1' description contains {{TODO}}");
      expect(todos).toContain("filter 'filter1' expression contains {{TODO}}");
    });

    it('should detect TODO markers in relationships', () => {
      const model: Model = {
        name: 'test',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [
          {
            name: 'user',
            description: '{{TODO}} verify cardinality',
            source_col: 'user_id',
            ref_col: '{{TODO}}',
          },
          {
            name: 'product',
            source_col: '{{TODO}}',
            ref_col: 'products.id',
          },
        ],
        clarifications: [],
      };

      const todos = findTodoMarkers(model);
      expect(todos).toContain("relationship 'user' description contains {{TODO}}");
      expect(todos).toContain("relationship 'user' ref_col contains {{TODO}}");
      expect(todos).toContain("relationship 'product' source_col contains {{TODO}}");
    });

    it('should detect TODO markers in clarifications', () => {
      const model: Model = {
        name: 'test',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
        clarifications: [
          'This is a normal clarification',
          '{{TODO}} verify this assumption',
          'Another normal one',
        ],
      };

      const todos = findTodoMarkers(model);
      expect(todos).toContain('clarification #2 contains {{TODO}}');
      expect(todos).not.toContain('clarification #1 contains {{TODO}}');
      expect(todos).not.toContain('clarification #3 contains {{TODO}}');
    });

    it('should detect TODO markers in complex option objects', () => {
      const model: Model = {
        name: 'test',
        dimensions: [
          {
            name: 'status',
            options: [
              { value: 1, description: 'Active' },
              { value: 2, description: '{{TODO}} determine status' },
              'pending',
            ],
            searchable: false,
          },
        ],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
        clarifications: [],
      };

      const todos = findTodoMarkers(model);
      expect(todos).toContain("dimension 'status' options contains {{TODO}}");
    });

    it('should return empty array when no TODOs exist', () => {
      const model: Model = {
        name: 'clean_model',
        description: 'A model with no TODOs',
        dimensions: [
          {
            name: 'id',
            description: 'Primary key',
            type: 'integer',
            searchable: false,
          },
        ],
        measures: [
          {
            name: 'count',
            description: 'Row count',
            type: 'integer',
          },
        ],
        metrics: [],
        filters: [],
        relationships: [],
        clarifications: [],
      };

      const todos = findTodoMarkers(model);
      expect(todos).toEqual([]);
    });
  });

  describe('fileContainsTodo', () => {
    it('should detect {{TODO}} in file content', async () => {
      const testFile = join(testDir, 'todo-model.yml');
      await writeFile(
        testFile,
        yaml.dump({
          name: 'test_model',
          description: 'Model with {{TODO}} in description',
          dimensions: [],
        })
      );

      const hasTodo = await fileContainsTodo(testFile);
      expect(hasTodo).toBe(true);
    });

    it('should return false for files without {{TODO}}', async () => {
      const testFile = join(testDir, 'clean-model.yml');
      await writeFile(
        testFile,
        yaml.dump({
          name: 'test_model',
          description: 'Clean model',
          dimensions: [],
        })
      );

      const hasTodo = await fileContainsTodo(testFile);
      expect(hasTodo).toBe(false);
    });
  });

  describe('parseModelFile with {{TODO}} markers', () => {
    it('should skip file parsing when {{TODO}} is detected', async () => {
      const testFile = join(testDir, 'todo-skip.yml');
      const content = `
name: test_model
description: >
  This model has {{TODO}} in description
dimensions:
  - name: field1
    type: {{TODO}}
`;
      await writeFile(testFile, content);

      const result = await parseModelFile(testFile);

      expect(result.models).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.issues[0]?.message).toContain(
        '{{TODO}} markers and will be skipped'
      );
    });

    it('should parse normally when no {{TODO}} exists', async () => {
      const testFile = join(testDir, 'normal-model.yml');
      const content = yaml.dump({
        name: 'test_model',
        description: 'Normal model',
        dimensions: [{ name: 'id', type: 'integer' }],
        measures: [],
      });
      await writeFile(testFile, content);

      const result = await parseModelFile(testFile);

      expect(result.models).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.models[0]?.name).toBe('test_model');
    });
  });

  describe('validateModel with TODOs', () => {
    it('should mark model as invalid when TODOs are present', () => {
      const model: Model = {
        name: 'test',
        description: 'Model with {{TODO}} marker',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
        clarifications: [],
      };

      const result = validateModel(model);
      expect(result.valid).toBe(false);
      expect(result.todos).toHaveLength(1);
      expect(result.todos).toContain('description contains {{TODO}}');
    });

    it('should return both errors and todos', () => {
      const model: Model = {
        name: '', // This will cause an error
        description: '{{TODO}} add description',
        dimensions: [],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
        clarifications: [],
      };

      const result = validateModel(model);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Model name is required');
      expect(result.errors).toContain('Model must have at least one dimension or measure');
      expect(result.todos).toContain('description contains {{TODO}}');
    });
  });

  describe('generateDefaultSQL', () => {
    it('should generate SQL with database and schema', () => {
      const model: Model = {
        name: 'users',
        database: 'analytics',
        schema: 'public',
        dimensions: [],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
        clarifications: [],
      };

      const sql = generateDefaultSQL(model);

      expect(sql).toBe('SELECT * FROM analytics.public.users');
    });

    it('should generate SQL with only schema', () => {
      const model: Model = {
        name: 'orders',
        schema: 'sales',
        dimensions: [],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
        clarifications: [],
      };

      const sql = generateDefaultSQL(model);

      expect(sql).toBe('SELECT * FROM sales.orders');
    });

    it('should generate SQL without database or schema', () => {
      const model: Model = {
        name: 'products',
        dimensions: [],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
        clarifications: [],
      };

      const sql = generateDefaultSQL(model);

      expect(sql).toBe('SELECT * FROM products');
    });
  });

  describe('ModelParsingError', () => {
    it('should format error message with Zod errors', () => {
      const zodError = {
        issues: [
          { path: ['name'], message: 'Required' },
          { path: ['dimensions', 0, 'type'], message: 'Invalid type' },
        ],
      } as any;

      const error = new ModelParsingError('Parse failed', '/path/to/file.yml', zodError);

      const detailed = error.getDetailedMessage();

      expect(detailed).toContain('Parse failed (/path/to/file.yml)');
      expect(detailed).toContain('name: Required');
      expect(detailed).toContain('dimensions.0.type: Invalid type');
    });

    it('should format error message without Zod errors', () => {
      const error = new ModelParsingError('Simple error', '/path/to/file.yml');

      const detailed = error.getDetailedMessage();

      expect(detailed).toBe('Simple error (/path/to/file.yml)');
    });
  });
});
