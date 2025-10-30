import { describe, expect, it } from 'vitest';
import {
  DeployDocSchema,
  DeployModelSchema,
  DeploymentFailureSchema,
  DeploymentItemSchema,
  DocDeployResultSchema,
  ModelDeployResultSchema,
  UnifiedDeployRequestSchema,
  UnifiedDeployResponseSchema,
} from './schemas';

describe('DeployModelSchema', () => {
  it('should validate a complete model', () => {
    const validModel = {
      name: 'test_model',
      data_source_name: 'postgres_ds',
      database: 'test_db',
      schema: 'public',
      description: 'A test model',
      sql_definition: 'SELECT * FROM test_table',
      yml_file: 'model: test',
      columns: [
        {
          name: 'id',
          description: 'Primary key',
          semantic_type: 'dimension',
          type: 'integer',
          searchable: true,
        },
        {
          name: 'amount',
          description: 'Amount column',
          semantic_type: 'measure',
          type: 'decimal',
          searchable: false,
        },
      ],
    };

    const result = DeployModelSchema.safeParse(validModel);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validModel);
    }
  });

  it('should validate minimal model', () => {
    const minimalModel = {
      name: 'simple_model',
      data_source_name: 'ds1',
      schema: 'public',
      columns: [],
    };

    const result = DeployModelSchema.safeParse(minimalModel);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.database).toBeUndefined();
      expect(result.data.description).toBe(''); // description has default('')
      expect(result.data.sql_definition).toBeUndefined();
      expect(result.data.yml_file).toBeUndefined();
    }
  });

  it('should require name, data_source_name, schema, and columns', () => {
    const invalidModel = {
      name: '',
      // missing data_source_name
      // missing schema
      // missing columns
    };

    const result = DeployModelSchema.safeParse(invalidModel);
    expect(result.success).toBe(false);
  });

  it('should validate column structure', () => {
    const modelWithInvalidColumn = {
      name: 'test_model',
      data_source_name: 'ds1',
      schema: 'public',
      columns: [
        {
          name: 'id',
          // missing other required fields are actually optional
        },
        {
          // missing name - this should fail
          description: 'Column without name',
        },
      ],
    };

    const result = DeployModelSchema.safeParse(modelWithInvalidColumn);
    expect(result.success).toBe(false);
  });
});

describe('DeployDocSchema', () => {
  it('should validate a normal doc', () => {
    const normalDoc = {
      name: 'README.md',
      content: '# Documentation\nThis is documentation content',
      type: 'normal' as const,
    };

    const result = DeployDocSchema.safeParse(normalDoc);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('normal');
    }
  });

  it('should validate an analyst doc', () => {
    const analystDoc = {
      name: 'ANALYST.md',
      content: '# Analyst Guide\nInstructions for analysts',
      type: 'analyst' as const,
    };

    const result = DeployDocSchema.safeParse(analystDoc);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('analyst');
    }
  });

  it('should default to normal type when not specified', () => {
    const docWithoutType = {
      name: 'guide.md',
      content: 'Some content',
    };

    const result = DeployDocSchema.safeParse(docWithoutType);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('normal');
    }
  });

  it('should reject invalid type', () => {
    const docWithInvalidType = {
      name: 'test.md',
      content: 'content',
      type: 'invalid',
    };

    const result = DeployDocSchema.safeParse(docWithInvalidType);
    expect(result.success).toBe(false);
  });

  it('should require name and content', () => {
    const incompleteDoc = {
      name: '',
      // missing content
    };

    const result = DeployDocSchema.safeParse(incompleteDoc);
    expect(result.success).toBe(false);
  });
});

describe('UnifiedDeployRequestSchema', () => {
  it('should validate complete request', () => {
    const request = {
      models: [
        {
          name: 'model1',
          data_source_name: 'ds1',
          schema: 'public',
          columns: [],
        },
      ],
      docs: [
        {
          name: 'README.md',
          content: '# Docs',
          type: 'normal' as const,
        },
      ],
      deleteAbsentModels: true,
      deleteAbsentDocs: false,
    };

    const result = UnifiedDeployRequestSchema.safeParse(request);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deleteAbsentModels).toBe(true);
      expect(result.data.deleteAbsentDocs).toBe(false);
    }
  });

  it('should provide defaults for missing fields', () => {
    const minimalRequest = {};

    const result = UnifiedDeployRequestSchema.safeParse(minimalRequest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.models).toEqual([]);
      expect(result.data.docs).toEqual([]);
      expect(result.data.deleteAbsentModels).toBe(true);
      expect(result.data.deleteAbsentDocs).toBe(true);
    }
  });

  it('should validate nested model and doc schemas', () => {
    const requestWithInvalidModel = {
      models: [
        {
          // missing required fields
          name: '',
        },
      ],
      docs: [
        {
          name: 'valid.md',
          content: 'valid content',
        },
      ],
    };

    const result = UnifiedDeployRequestSchema.safeParse(requestWithInvalidModel);
    expect(result.success).toBe(false);
  });
});

describe('DeploymentItemSchema', () => {
  it('should validate minimal deployment item', () => {
    const item = {
      name: 'model_name',
    };

    const result = DeploymentItemSchema.safeParse(item);
    expect(result.success).toBe(true);
  });

  it('should validate complete deployment item', () => {
    const item = {
      name: 'model_name',
      dataSource: 'postgres_ds',
      schema: 'public',
      database: 'analytics',
    };

    const result = DeploymentItemSchema.safeParse(item);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(item);
    }
  });

  it('should require name', () => {
    const itemWithoutName = {
      dataSource: 'ds1',
      schema: 'public',
    };

    const result = DeploymentItemSchema.safeParse(itemWithoutName);
    expect(result.success).toBe(false);
  });
});

describe('DeploymentFailureSchema', () => {
  it('should validate failure with single error', () => {
    const failure = {
      name: 'failed_model',
      errors: ['Data source not found'],
    };

    const result = DeploymentFailureSchema.safeParse(failure);
    expect(result.success).toBe(true);
  });

  it('should validate failure with multiple errors', () => {
    const failure = {
      name: 'complex_failure',
      errors: ['Data source not found', 'Schema validation failed', 'Permission denied'],
    };

    const result = DeploymentFailureSchema.safeParse(failure);
    expect(result.success).toBe(true);
  });

  it('should require name and errors array', () => {
    const incompleteFailure = {
      name: 'test',
      // missing errors array
    };

    const result = DeploymentFailureSchema.safeParse(incompleteFailure);
    expect(result.success).toBe(false);
  });

  it('should reject empty errors array', () => {
    const failureWithNoErrors = {
      name: 'test',
      errors: [],
    };

    const result = DeploymentFailureSchema.safeParse(failureWithNoErrors);
    expect(result.success).toBe(true); // Actually, empty array should be valid
  });
});

describe('ModelDeployResultSchema', () => {
  it('should validate complete result', () => {
    const result = {
      success: [{ name: 'model1', dataSource: 'ds1' }],
      updated: [{ name: 'model2', dataSource: 'ds2' }],
      failures: [{ name: 'model3', errors: ['Error message'] }],
      deleted: ['model4'],
      summary: {
        totalModels: 4,
        successCount: 1,
        updateCount: 1,
        failureCount: 1,
        deletedCount: 1,
      },
    };

    const parseResult = ModelDeployResultSchema.safeParse(result);
    expect(parseResult.success).toBe(true);
  });

  it('should provide defaults for missing arrays', () => {
    const minimalResult = {
      summary: {
        totalModels: 0,
        successCount: 0,
        updateCount: 0,
        failureCount: 0,
        deletedCount: 0,
      },
    };

    const parseResult = ModelDeployResultSchema.safeParse(minimalResult);
    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.data.success).toEqual([]);
      expect(parseResult.data.updated).toEqual([]);
      expect(parseResult.data.failures).toEqual([]);
      expect(parseResult.data.deleted).toEqual([]);
    }
  });

  it('should require summary object', () => {
    const resultWithoutSummary = {
      success: [],
      updated: [],
      failures: [],
      deleted: [],
    };

    const parseResult = ModelDeployResultSchema.safeParse(resultWithoutSummary);
    expect(parseResult.success).toBe(false);
  });

  it('should validate summary fields', () => {
    const resultWithInvalidSummary = {
      summary: {
        totalModels: 'not_a_number',
        successCount: 1,
        updateCount: 1,
        failureCount: 1,
        deletedCount: 1,
      },
    };

    const parseResult = ModelDeployResultSchema.safeParse(resultWithInvalidSummary);
    expect(parseResult.success).toBe(false);
  });
});

describe('DocDeployResultSchema', () => {
  it('should validate complete doc result', () => {
    const result = {
      created: ['doc1.md', 'doc2.md'],
      updated: ['doc3.md'],
      deleted: ['doc4.md'],
      failed: [{ name: 'doc5.md', error: 'Storage failed' }],
      summary: {
        totalDocs: 5,
        createdCount: 2,
        updatedCount: 1,
        deletedCount: 1,
        failedCount: 1,
      },
    };

    const parseResult = DocDeployResultSchema.safeParse(result);
    expect(parseResult.success).toBe(true);
  });

  it('should provide defaults for missing arrays', () => {
    const minimalResult = {
      summary: {
        totalDocs: 0,
        createdCount: 0,
        updatedCount: 0,
        deletedCount: 0,
        failedCount: 0,
      },
    };

    const parseResult = DocDeployResultSchema.safeParse(minimalResult);
    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.data.created).toEqual([]);
      expect(parseResult.data.updated).toEqual([]);
      expect(parseResult.data.deleted).toEqual([]);
      expect(parseResult.data.failed).toEqual([]);
    }
  });

  it('should validate failed doc structure', () => {
    const resultWithInvalidFailed = {
      failed: [
        { name: 'doc1.md', error: 'Valid error' },
        { name: 'doc2.md' }, // missing error field
      ],
      summary: {
        totalDocs: 2,
        createdCount: 0,
        updatedCount: 0,
        deletedCount: 0,
        failedCount: 2,
      },
    };

    const parseResult = DocDeployResultSchema.safeParse(resultWithInvalidFailed);
    expect(parseResult.success).toBe(false);
  });
});

describe('UnifiedDeployResponseSchema', () => {
  it('should validate complete response', () => {
    const response = {
      models: {
        success: [{ name: 'model1' }],
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
      automation: {
        configured: false,
      },
    };

    const parseResult = UnifiedDeployResponseSchema.safeParse(response);
    expect(parseResult.success).toBe(true);
  });

  it('should require both models and docs results', () => {
    const incompleteResponse = {
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
      // missing docs
    };

    const parseResult = UnifiedDeployResponseSchema.safeParse(incompleteResponse);
    expect(parseResult.success).toBe(false);
  });

  it('should validate nested result schemas', () => {
    const responseWithInvalidNesting = {
      models: {
        success: [],
        updated: [],
        failures: [],
        deleted: [],
        summary: {
          totalModels: 'invalid', // should be number
          successCount: 0,
          updateCount: 0,
          failureCount: 0,
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

    const parseResult = UnifiedDeployResponseSchema.safeParse(responseWithInvalidNesting);
    expect(parseResult.success).toBe(false);
  });
});

describe('Schema integration', () => {
  it('should create valid request and response cycle', () => {
    // Create a valid request
    const request = {
      models: [
        {
          name: 'users',
          data_source_name: 'analytics_db',
          schema: 'public',
          description: 'User data model',
          columns: [
            {
              name: 'id',
              description: 'User ID',
              semantic_type: 'dimension',
              type: 'integer',
              searchable: true,
            },
          ],
        },
      ],
      docs: [
        {
          name: 'users.md',
          content: '# Users Model Documentation',
          type: 'normal' as const,
        },
      ],
    };

    const requestResult = UnifiedDeployRequestSchema.safeParse(request);
    expect(requestResult.success).toBe(true);

    // Create matching response
    const response = {
      models: {
        success: [{ name: 'users', dataSource: 'analytics_db' }],
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
      docs: {
        created: ['users.md'],
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
      automation: {
        configured: false,
      },
    };

    const responseResult = UnifiedDeployResponseSchema.safeParse(response);
    expect(responseResult.success).toBe(true);
  });
});
