import { describe, expect, it } from 'vitest';
import {
  BigQueryCredentialsSchema,
  CredentialsSchema,
  DataSourceTypeSchema,
  MotherDuckCredentialsSchema,
  MySQLCredentialsSchema,
  PostgreSQLCredentialsSchema,
  RedshiftCredentialsSchema,
  SnowflakeConnectionConfigSchema,
  SnowflakeCredentialsSchema,
  SQLServerCredentialsSchema,
  WarehouseConfigSchema,
} from './schemas';

describe('DataSourceTypeSchema', () => {
  it('should validate all supported data source types', () => {
    expect(DataSourceTypeSchema.parse('snowflake')).toBe('snowflake');
    expect(DataSourceTypeSchema.parse('bigquery')).toBe('bigquery');
    expect(DataSourceTypeSchema.parse('postgres')).toBe('postgres');
    expect(DataSourceTypeSchema.parse('mysql')).toBe('mysql');
    expect(DataSourceTypeSchema.parse('sqlserver')).toBe('sqlserver');
    expect(DataSourceTypeSchema.parse('redshift')).toBe('redshift');
    expect(DataSourceTypeSchema.parse('motherduck')).toBe('motherduck');
  });

  it('should reject unsupported data source types', () => {
    const result = DataSourceTypeSchema.safeParse('unknown_db');
    expect(result.success).toBe(false);
  });
});

describe('SnowflakeCredentialsSchema', () => {
  it('should validate valid Snowflake credentials with all required fields', () => {
    const valid = {
      type: 'snowflake',
      account_id: 'ABC12345.us-central1.gcp',
      warehouse_id: 'WH_PROD',
      username: 'user',
      password: 'pass',
      default_database: 'ANALYTICS',
    };

    const result = SnowflakeCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('snowflake');
      expect(result.data.account_id).toBe('ABC12345.us-central1.gcp');
    }
  });

  it('should validate Snowflake credentials with optional fields', () => {
    const withOptionals = {
      type: 'snowflake',
      account_id: 'ABC123',
      warehouse_id: 'WH_PROD',
      username: 'user',
      password: 'pass',
      default_database: 'ANALYTICS',
      role: 'ANALYST',
      default_schema: 'PUBLIC',
      custom_host: 'custom.snowflake.com:443',
    };

    const result = SnowflakeCredentialsSchema.safeParse(withOptionals);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('ANALYST');
      expect(result.data.default_schema).toBe('PUBLIC');
      expect(result.data.custom_host).toBe('custom.snowflake.com:443');
    }
  });

  it('should reject Snowflake credentials missing required fields', () => {
    const invalid = {
      type: 'snowflake',
      account_id: 'ABC123',
      // missing warehouse_id, username, password, default_database
    };

    const result = SnowflakeCredentialsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject Snowflake credentials with wrong type', () => {
    const invalid = {
      type: 'bigquery',
      account_id: 'ABC123',
      warehouse_id: 'WH_PROD',
      username: 'user',
      password: 'pass',
      default_database: 'ANALYTICS',
    };

    const result = SnowflakeCredentialsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('BigQueryCredentialsSchema', () => {
  it('should validate valid BigQuery credentials', () => {
    const valid = {
      type: 'bigquery',
      project_id: 'my-gcp-project',
    };

    const result = BigQueryCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should accept service account key as string', () => {
    const valid = {
      type: 'bigquery',
      project_id: 'my-gcp-project',
      service_account_key: '{"type":"service_account","project_id":"my-project"}',
    };

    const result = BigQueryCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should accept service account key as object', () => {
    const valid = {
      type: 'bigquery',
      project_id: 'my-gcp-project',
      service_account_key: { type: 'service_account', project_id: 'my-project' },
    };

    const result = BigQueryCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should accept optional fields', () => {
    const valid = {
      type: 'bigquery',
      project_id: 'my-gcp-project',
      key_file_path: '/path/to/key.json',
      default_dataset: 'analytics',
      location: 'us-central1',
    };

    const result = BigQueryCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

describe('PostgreSQLCredentialsSchema', () => {
  it('should validate valid PostgreSQL credentials', () => {
    const valid = {
      type: 'postgres',
      host: 'localhost',
      default_database: 'mydb',
      username: 'user',
      password: 'pass',
    };

    const result = PostgreSQLCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should accept SSL as boolean', () => {
    const valid = {
      type: 'postgres',
      host: 'localhost',
      default_database: 'mydb',
      username: 'user',
      password: 'pass',
      ssl: true,
    };

    const result = PostgreSQLCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should accept SSL as object', () => {
    const valid = {
      type: 'postgres',
      host: 'localhost',
      default_database: 'mydb',
      username: 'user',
      password: 'pass',
      ssl: {
        rejectUnauthorized: true,
        ca: 'cert-content',
        cert: 'client-cert',
        key: 'client-key',
      },
    };

    const result = PostgreSQLCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should accept optional fields', () => {
    const valid = {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      default_database: 'mydb',
      database: 'mydb_alias',
      username: 'user',
      password: 'pass',
      schema: 'public',
      connection_timeout: 30000,
    };

    const result = PostgreSQLCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

describe('MySQLCredentialsSchema', () => {
  it('should validate valid MySQL credentials', () => {
    const valid = {
      type: 'mysql',
      host: 'localhost',
      default_database: 'mydb',
      username: 'user',
      password: 'pass',
    };

    const result = MySQLCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should accept optional charset', () => {
    const valid = {
      type: 'mysql',
      host: 'localhost',
      default_database: 'mydb',
      username: 'user',
      password: 'pass',
      charset: 'utf8mb4',
    };

    const result = MySQLCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

describe('SQLServerCredentialsSchema', () => {
  it('should validate valid SQL Server credentials', () => {
    const valid = {
      type: 'sqlserver',
      host: 'localhost',
      default_database: 'mydb',
      username: 'user',
      password: 'pass',
    };

    const result = SQLServerCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should accept Windows authentication fields', () => {
    const valid = {
      type: 'sqlserver',
      host: 'localhost',
      default_database: 'mydb',
      username: 'user',
      password: 'pass',
      domain: 'MYDOMAIN',
      instance: 'SQLEXPRESS',
    };

    const result = SQLServerCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should accept encryption settings', () => {
    const valid = {
      type: 'sqlserver',
      host: 'localhost',
      default_database: 'mydb',
      username: 'user',
      password: 'pass',
      encrypt: true,
      trust_server_certificate: false,
    };

    const result = SQLServerCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

describe('RedshiftCredentialsSchema', () => {
  it('should validate valid Redshift credentials', () => {
    const valid = {
      type: 'redshift',
      host: 'my-cluster.region.redshift.amazonaws.com',
      default_database: 'analytics',
      username: 'user',
      password: 'pass',
    };

    const result = RedshiftCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should accept optional Redshift fields', () => {
    const valid = {
      type: 'redshift',
      host: 'my-cluster.region.redshift.amazonaws.com',
      port: 5439,
      default_database: 'analytics',
      username: 'user',
      password: 'pass',
      default_schema: 'public',
      ssl: true,
      cluster_identifier: 'my-cluster',
    };

    const result = RedshiftCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

describe('MotherDuckCredentialsSchema', () => {
  it('should validate valid MotherDuck credentials', () => {
    const valid = {
      type: 'motherduck',
      token: 'my-token-12345',
      default_database: 'my_database',
    };

    const result = MotherDuckCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should accept optional MotherDuck fields', () => {
    const valid = {
      type: 'motherduck',
      token: 'my-token-12345',
      default_database: 'my_database',
      saas_mode: true,
      attach_mode: 'multi' as const,
      connection_timeout: 30000,
      query_timeout: 60000,
    };

    const result = MotherDuckCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.saas_mode).toBe(true);
      expect(result.data.attach_mode).toBe('multi');
    }
  });

  it('should validate attach_mode enum values', () => {
    const multi = {
      type: 'motherduck',
      token: 'token',
      default_database: 'db',
      attach_mode: 'multi' as const,
    };
    expect(MotherDuckCredentialsSchema.safeParse(multi).success).toBe(true);

    const single = {
      type: 'motherduck',
      token: 'token',
      default_database: 'db',
      attach_mode: 'single' as const,
    };
    expect(MotherDuckCredentialsSchema.safeParse(single).success).toBe(true);

    const invalid = {
      type: 'motherduck',
      token: 'token',
      default_database: 'db',
      attach_mode: 'invalid',
    };
    expect(MotherDuckCredentialsSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('CredentialsSchema (discriminated union)', () => {
  it('should correctly identify and validate Snowflake credentials', () => {
    const snowflakeCreds = {
      type: 'snowflake',
      account_id: 'ABC123',
      warehouse_id: 'WH_PROD',
      username: 'user',
      password: 'pass',
      default_database: 'ANALYTICS',
    };

    const result = CredentialsSchema.safeParse(snowflakeCreds);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('snowflake');
    }
  });

  it('should correctly identify and validate BigQuery credentials', () => {
    const bigqueryCreds = {
      type: 'bigquery',
      project_id: 'my-project',
    };

    const result = CredentialsSchema.safeParse(bigqueryCreds);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('bigquery');
    }
  });

  it('should correctly identify and validate PostgreSQL credentials', () => {
    const postgresCreds = {
      type: 'postgres',
      host: 'localhost',
      default_database: 'mydb',
      username: 'user',
      password: 'pass',
    };

    const result = CredentialsSchema.safeParse(postgresCreds);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('postgres');
    }
  });

  it('should correctly identify and validate MySQL credentials', () => {
    const mysqlCreds = {
      type: 'mysql',
      host: 'localhost',
      default_database: 'mydb',
      username: 'user',
      password: 'pass',
    };

    const result = CredentialsSchema.safeParse(mysqlCreds);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('mysql');
    }
  });

  it('should correctly identify and validate SQL Server credentials', () => {
    const sqlserverCreds = {
      type: 'sqlserver',
      host: 'localhost',
      default_database: 'mydb',
      username: 'user',
      password: 'pass',
    };

    const result = CredentialsSchema.safeParse(sqlserverCreds);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('sqlserver');
    }
  });

  it('should correctly identify and validate Redshift credentials', () => {
    const redshiftCreds = {
      type: 'redshift',
      host: 'my-cluster.redshift.amazonaws.com',
      default_database: 'analytics',
      username: 'user',
      password: 'pass',
    };

    const result = CredentialsSchema.safeParse(redshiftCreds);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('redshift');
    }
  });

  it('should correctly identify and validate MotherDuck credentials', () => {
    const motherduckCreds = {
      type: 'motherduck',
      token: 'my-token',
      default_database: 'mydb',
    };

    const result = CredentialsSchema.safeParse(motherduckCreds);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('motherduck');
    }
  });

  it('should reject unknown credential type', () => {
    const invalid = {
      type: 'unknown_db',
      some_field: 'value',
    };

    const result = CredentialsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject credentials with missing required fields', () => {
    const invalid = {
      type: 'snowflake',
      account_id: 'ABC123',
      // missing required fields
    };

    const result = CredentialsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('SnowflakeConnectionConfigSchema', () => {
  it('should extend Snowflake credentials with connection options', () => {
    const valid = {
      type: 'snowflake',
      account_id: 'ABC123',
      warehouse_id: 'WH_PROD',
      username: 'user',
      password: 'pass',
      default_database: 'ANALYTICS',
      timeout: 60000,
      clientSessionKeepAlive: true,
      validateDefaultParameters: true,
      options: { application: 'MyApp' },
    };

    const result = SnowflakeConnectionConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timeout).toBe(60000);
      expect(result.data.clientSessionKeepAlive).toBe(true);
    }
  });
});

describe('WarehouseConfigSchema', () => {
  it('should validate warehouse configuration with credentials', () => {
    const valid = {
      name: 'my-warehouse',
      type: 'snowflake',
      credentials: {
        type: 'snowflake',
        account_id: 'ABC123',
        warehouse_id: 'WH_PROD',
        username: 'user',
        password: 'pass',
        default_database: 'ANALYTICS',
      },
      config: { region: 'us-east-1' },
    };

    const result = WarehouseConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('my-warehouse');
      expect(result.data.credentials.type).toBe('snowflake');
    }
  });

  it('should accept different credential types in warehouse config', () => {
    const postgresConfig = {
      name: 'pg-warehouse',
      type: 'postgres',
      credentials: {
        type: 'postgres',
        host: 'localhost',
        default_database: 'mydb',
        username: 'user',
        password: 'pass',
      },
    };

    const result = WarehouseConfigSchema.safeParse(postgresConfig);
    expect(result.success).toBe(true);
  });
});
