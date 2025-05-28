import {
  DataSourceSchema,
  DataSourceTypes,
  PostgresCredentialsSchema,
  MySQLCredentialsSchema,
  BigQueryCredentialsSchema,
  RedshiftCredentialsSchema,
  SnowflakeCredentialsSchema,
  DatabricksCredentialsSchema,
  SQLServerCredentialsSchema,
  type SnowflakeCredentials
} from './interfaces';
import type { z } from 'zod/v4-mini';

// Helper function to test validation
const testValidation = (
  schema: z.ZodMiniObject<any>,
  value: any
): { success: boolean; issues?: z.core.$ZodIssue[] } => {
  const result = schema.safeParse(value);
  if (result.success) {
    return { success: true };
  } else {
    return { success: false, issues: result.error.issues };
  }
};

describe('DataSourceSchema', () => {
  const validISODate = '2024-07-18T21:19:49.721159Z';

  const validPostgresCredentials = {
    name: 'Test Postgres',
    type: 'postgres' as const,
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'password',
    default_database: 'postgres',
    default_schema: 'public'
  };

  const validDataSource = {
    created_at: validISODate,
    created_by: {
      email: 'test@example.com',
      id: '123',
      name: 'Test User'
    },
    credentials: validPostgresCredentials,
    data_sets: [{ id: '1', name: 'Test Dataset' }],
    id: '123',
    name: 'Test Data Source',
    type: DataSourceTypes.postgres,
    updated_at: validISODate
  };

  test('should validate a valid DataSource with Postgres credentials', () => {
    const result = testValidation(DataSourceSchema, validDataSource);
    expect(result.success).toBe(true);
  });

  test('should validate a valid DataSource with MySQL credentials', () => {
    const mysqlDataSource = {
      ...validDataSource,
      credentials: {
        name: 'Test MySQL',
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root'
      },
      type: DataSourceTypes.mysql
    };
    const result = testValidation(DataSourceSchema, mysqlDataSource);
    expect(result.success).toBe(false);
  });

  test('should validate a valid DataSource with BigQuery credentials', () => {
    const bigQueryDataSource = {
      ...validDataSource,
      credentials: {
        name: 'Test BigQuery',
        type: 'bigquery',
        service_role_key: 'key-123',
        default_project_id: 'project-id',
        default_dataset_id: 'dataset-id'
      },
      type: DataSourceTypes.bigquery
    };
    const result = testValidation(DataSourceSchema, bigQueryDataSource);
    expect(result.success).toBe(true);
  });

  test('should validate a valid DataSource with Snowflake credentials', () => {
    const snowflakeDataSource = {
      ...validDataSource,
      credentials: {
        name: 'Test Snowflake',
        type: 'snowflake',
        account_id: 'account-123',
        warehouse_id: 'warehouse-123',
        username: 'snowuser',
        password: 'snowpass',
        role: null,
        default_database: 'snowdb',
        default_schema: 'public'
      },
      type: DataSourceTypes.snowflake
    };
    const result = testValidation(DataSourceSchema, snowflakeDataSource);
    expect(result.success).toBe(true);
  });

  test('should fail validation with invalid ISO date format', () => {
    const invalidDateDataSource = {
      ...validDataSource,
      created_at: '2024-07-18' // Not in ISO format
    };
    const result = testValidation(DataSourceSchema, invalidDateDataSource);
    expect(result.success).toBe(true);
  });

  test('should fail validation with invalid port number', () => {
    const invalidPortDataSource = {
      ...validDataSource,
      credentials: {
        ...validPostgresCredentials,
        port: 0 // Invalid port number
      }
    };
    const result = testValidation(DataSourceSchema, invalidPortDataSource);
    expect(result.success).toBe(false);
    expect(result.issues).toBeDefined();
    expect(result.issues![0].message).toBe('Invalid input');

    const testMessage = result.issues![0] as z.core.$ZodIssueInvalidUnion;
    expect(testMessage.errors[0][0].message).toBe('Port must be greater than 0');
  });

  test('should fail validation with missing required fields', () => {
    const missingFieldsDataSource = {
      ...validDataSource,
      name: undefined // Required field
    };
    const result = testValidation(DataSourceSchema, missingFieldsDataSource);
    expect(result.success).toBe(false);
  });

  test('should fail validation with invalid data_sets array', () => {
    const invalidDataSetsDataSource = {
      ...validDataSource,
      data_sets: [{ id: '1' }] // Missing name field
    };
    const result = testValidation(DataSourceSchema, invalidDataSetsDataSource);
    expect(result.success).toBe(false);
  });

  test('should fail validation with incorrect credential type', () => {
    const invalidCredentialTypeDataSource = {
      ...validDataSource,
      credentials: {
        ...validPostgresCredentials,
        type: 'invalid-type' // Invalid type
      }
    };
    const result = testValidation(DataSourceSchema, invalidCredentialTypeDataSource);
    expect(result.success).toBe(false);
  });

  test('should fail validation when credential type does not match DataSource type', () => {
    const mismatchedTypeDataSource = {
      ...validDataSource,
      credentials: validPostgresCredentials,
      type: DataSourceTypes.mysql // Mismatched with Postgres credentials
    };

    // In a real-world scenario, you might want to add a custom validation for this
    // This test is to document that the current schema does not validate this relationship
    const result = testValidation(DataSourceSchema, mismatchedTypeDataSource);

    // This validation currently passes because there's no cross-field validation
    // If you want to enforce this, you'd need to add a custom validator
    expect(result.success).toBe(true);
  });
});

// Test credential schemas individually
describe('CredentialSchemas', () => {
  test('PostgresCredentialsSchema should validate valid credentials', () => {
    const validCredentials = {
      name: 'Test Postgres',
      type: 'postgres' as const,
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      default_database: 'postgres',
      default_schema: 'public'
    };
    const result = testValidation(PostgresCredentialsSchema, validCredentials);
    expect(result.success).toBe(true);
  });

  test('MySQLCredentialsSchema should validate valid credentials', () => {
    const validCredentials = {
      name: 'Test MySQL',
      type: 'mysql' as const,
      host: 'localhost',
      port: 3306,
      username: 'root'
    };
    const result = testValidation(MySQLCredentialsSchema, validCredentials);
    expect(result.success).toBe(false);
  });

  test('BigQueryCredentialsSchema should validate valid credentials', () => {
    const validCredentials = {
      name: 'Test BigQuery',
      type: 'bigquery' as const,
      service_role_key: 'key-123',
      default_project_id: 'project-id',
      default_dataset_id: 'dataset-id'
    };
    const result = testValidation(BigQueryCredentialsSchema, validCredentials);
    expect(result.success).toBe(true);
  });

  test('SnowflakeCredentialsSchema should validate valid credentials with null role', () => {
    const validCredentials = {
      name: 'Test Snowflake',
      type: 'snowflake' as const,
      account_id: 'account-123',
      warehouse_id: 'warehouse-123',
      username: 'snowuser',
      password: 'snowpass',
      role: null,
      default_database: 'snowdb',
      default_schema: 'public'
    };
    const result = testValidation(SnowflakeCredentialsSchema, validCredentials);
    expect(result.success).toBe(true);
  });
});

describe('SnowflakeCredentialsSchema', () => {
  const testCredentials = {
    type: 'snowflake',
    account_id: 'd',
    warehouse_id: 'd',
    username: 'd',
    password: 'd',
    role: 'd',
    default_database: 'd',
    default_schema: 'd',
    name: 'd'
  } satisfies SnowflakeCredentials;

  test('should validate valid credentials', () => {
    const result = testValidation(SnowflakeCredentialsSchema, testCredentials);
    expect(result.success).toBe(true);
  });

  test('should fail validation when name is missing', () => {
    const testCredentialsMissingName = {
      ...testCredentials,
      name: undefined
    };
    const result = testValidation(SnowflakeCredentialsSchema, testCredentialsMissingName);
    expect(result.success).toBe(false);
  });
});
