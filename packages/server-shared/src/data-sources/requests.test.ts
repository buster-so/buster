import { describe, expect, it } from 'vitest';
import {
  BigqueryCredentialsSchema,
  CreateDataSourceRequestSchema,
  DatabricksCredentialsSchema,
  ListDataSourcesQuerySchema,
  MotherDuckCredentialsSchema,
  MySqlCredentialsSchema,
  PostgresCredentialsSchema,
  RedshiftCredentialsSchema,
  SnowflakeCredentialsSchema,
  SqlServerCredentialsSchema,
  UpdateDataSourceRequestSchema,
} from './requests';

describe('Data Source Request Schemas', () => {
  describe('PostgresCredentialsSchema', () => {
    it('should validate valid postgres credentials with all fields', () => {
      const data = {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'admin',
        password: 'secret',
        default_database: 'mydb',
        default_schema: 'public',
      };
      expect(PostgresCredentialsSchema.safeParse(data).success).toBe(true);
    });

    it('should validate postgres credentials with SSH tunnel', () => {
      const data = {
        type: 'postgres',
        host: 'remote.db.com',
        port: 5432,
        username: 'admin',
        password: 'secret',
        default_database: 'mydb',
        jump_host: 'bastion.example.com',
        ssh_username: 'ubuntu',
        ssh_private_key: '-----BEGIN RSA PRIVATE KEY-----...',
      };
      expect(PostgresCredentialsSchema.safeParse(data).success).toBe(true);
    });

    it('should reject postgres credentials with missing required fields', () => {
      const data = {
        type: 'postgres',
        host: 'localhost',
        // missing port, username, password, database
      };
      const result = PostgresCredentialsSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(4);
      }
    });

    it('should reject invalid port number', () => {
      const data = {
        type: 'postgres',
        host: 'localhost',
        port: -1,
        username: 'admin',
        password: 'secret',
        default_database: 'mydb',
      };
      expect(PostgresCredentialsSchema.safeParse(data).success).toBe(false);
    });

    it('should reject zero port number', () => {
      const data = {
        type: 'postgres',
        host: 'localhost',
        port: 0,
        username: 'admin',
        password: 'secret',
        default_database: 'mydb',
      };
      expect(PostgresCredentialsSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('MySqlCredentialsSchema', () => {
    it('should validate valid mysql credentials', () => {
      const data = {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'secret',
        default_database: 'mydb',
      };
      expect(MySqlCredentialsSchema.safeParse(data).success).toBe(true);
    });

    it('should validate mysql credentials with schema', () => {
      const data = {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'secret',
        default_database: 'mydb',
        default_schema: 'public',
      };
      expect(MySqlCredentialsSchema.safeParse(data).success).toBe(true);
    });

    it('should reject mysql with missing required fields', () => {
      const data = {
        type: 'mysql',
        host: 'localhost',
      };
      const result = MySqlCredentialsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('BigqueryCredentialsSchema', () => {
    it('should validate valid bigquery credentials', () => {
      const data = {
        type: 'bigquery',
        credentials_json: '{"type":"service_account","project_id":"my-project"}',
        default_project_id: 'my-project',
        default_dataset_id: 'my_dataset',
      };
      expect(BigqueryCredentialsSchema.safeParse(data).success).toBe(true);
    });

    it('should reject invalid JSON in credentials_json', () => {
      const data = {
        type: 'bigquery',
        credentials_json: 'not-valid-json',
        default_project_id: 'my-project',
        default_dataset_id: 'my_dataset',
      };
      const result = BigqueryCredentialsSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid JSON');
      }
    });

    it('should reject empty credentials_json', () => {
      const data = {
        type: 'bigquery',
        credentials_json: '',
        default_project_id: 'my-project',
        default_dataset_id: 'my_dataset',
      };
      expect(BigqueryCredentialsSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('SnowflakeCredentialsSchema', () => {
    it('should validate valid snowflake credentials', () => {
      const data = {
        type: 'snowflake',
        account_id: 'abc123',
        warehouse_id: 'COMPUTE_WH',
        username: 'admin',
        password: 'secret',
        default_database: 'MYDB',
      };
      expect(SnowflakeCredentialsSchema.safeParse(data).success).toBe(true);
    });

    it('should validate snowflake with optional fields', () => {
      const data = {
        type: 'snowflake',
        account_id: 'abc123',
        warehouse_id: 'COMPUTE_WH',
        username: 'admin',
        password: 'secret',
        default_database: 'MYDB',
        default_schema: 'PUBLIC',
        role: 'SYSADMIN',
      };
      expect(SnowflakeCredentialsSchema.safeParse(data).success).toBe(true);
    });

    it('should reject snowflake with missing required fields', () => {
      const data = {
        type: 'snowflake',
        account_id: 'abc123',
      };
      expect(SnowflakeCredentialsSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('DatabricksCredentialsSchema', () => {
    it('should validate valid databricks credentials', () => {
      const data = {
        type: 'databricks',
        host: 'adb-1234567890123456.7.azuredatabricks.net',
        api_key: 'dapi123456789',
        warehouse_id: 'abc123def456',
        default_catalog: 'main',
      };
      expect(DatabricksCredentialsSchema.safeParse(data).success).toBe(true);
    });

    it('should validate databricks with optional schema', () => {
      const data = {
        type: 'databricks',
        host: 'adb-1234567890123456.7.azuredatabricks.net',
        api_key: 'dapi123456789',
        warehouse_id: 'abc123def456',
        default_catalog: 'main',
        default_schema: 'default',
      };
      expect(DatabricksCredentialsSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('SqlServerCredentialsSchema', () => {
    it('should validate valid sql server credentials', () => {
      const data = {
        type: 'sqlserver',
        host: 'localhost',
        port: 1433,
        username: 'sa',
        password: 'secret',
        default_database: 'master',
      };
      expect(SqlServerCredentialsSchema.safeParse(data).success).toBe(true);
    });

    it('should reject sql server with invalid port', () => {
      const data = {
        type: 'sqlserver',
        host: 'localhost',
        port: -1,
        username: 'sa',
        password: 'secret',
        default_database: 'master',
      };
      expect(SqlServerCredentialsSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('RedshiftCredentialsSchema', () => {
    it('should validate valid redshift credentials', () => {
      const data = {
        type: 'redshift',
        host: 'my-cluster.abc123.us-east-1.redshift.amazonaws.com',
        port: 5439,
        username: 'admin',
        password: 'secret',
        default_database: 'dev',
      };
      expect(RedshiftCredentialsSchema.safeParse(data).success).toBe(true);
    });

    it('should validate redshift with optional schema', () => {
      const data = {
        type: 'redshift',
        host: 'my-cluster.abc123.us-east-1.redshift.amazonaws.com',
        port: 5439,
        username: 'admin',
        password: 'secret',
        default_database: 'dev',
        default_schema: 'public',
      };
      expect(RedshiftCredentialsSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('MotherDuckCredentialsSchema', () => {
    it('should validate valid motherduck credentials', () => {
      const data = {
        type: 'motherduck',
        token: 'my-token-123',
        default_database: 'my_db',
      };
      expect(MotherDuckCredentialsSchema.safeParse(data).success).toBe(true);
    });

    it('should validate motherduck with all optional fields', () => {
      const data = {
        type: 'motherduck',
        token: 'my-token-123',
        default_database: 'my_db',
        saas_mode: true,
        attach_mode: 'multi' as const,
        connection_timeout: 30000,
        query_timeout: 60000,
      };
      expect(MotherDuckCredentialsSchema.safeParse(data).success).toBe(true);
    });

    it('should reject invalid attach_mode', () => {
      const data = {
        type: 'motherduck',
        token: 'my-token-123',
        default_database: 'my_db',
        attach_mode: 'invalid',
      };
      expect(MotherDuckCredentialsSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('CreateDataSourceRequestSchema', () => {
    it('should validate discriminated union for postgres', () => {
      const data = {
        name: 'My Postgres DB',
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'admin',
        password: 'secret',
        default_database: 'mydb',
      };
      expect(CreateDataSourceRequestSchema.safeParse(data).success).toBe(true);
    });

    it('should validate discriminated union for motherduck', () => {
      const data = {
        name: 'My MotherDuck',
        type: 'motherduck',
        token: 'my-token',
        default_database: 'my_db',
      };
      expect(CreateDataSourceRequestSchema.safeParse(data).success).toBe(true);
    });

    it('should validate discriminated union for bigquery', () => {
      const data = {
        name: 'My BigQuery',
        type: 'bigquery',
        credentials_json: '{"type":"service_account"}',
        default_project_id: 'my-project',
        default_dataset_id: 'my_dataset',
      };
      expect(CreateDataSourceRequestSchema.safeParse(data).success).toBe(true);
    });

    it('should reject when type does not match credentials', () => {
      const data = {
        name: 'Mixed Credentials',
        type: 'postgres',
        token: 'motherduck-token', // wrong credential fields for postgres
        default_database: 'mydb',
      };
      expect(CreateDataSourceRequestSchema.safeParse(data).success).toBe(false);
    });

    it('should reject unsupported data source type', () => {
      const data = {
        name: 'Unknown DB',
        type: 'unknown_type',
        host: 'localhost',
      };
      expect(CreateDataSourceRequestSchema.safeParse(data).success).toBe(false);
    });

    it('should reject missing name field', () => {
      const data = {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'admin',
        password: 'secret',
        default_database: 'mydb',
      };
      expect(CreateDataSourceRequestSchema.safeParse(data).success).toBe(false);
    });

    it('should reject empty name', () => {
      const data = {
        name: '',
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'admin',
        password: 'secret',
        default_database: 'mydb',
      };
      expect(CreateDataSourceRequestSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('UpdateDataSourceRequestSchema', () => {
    it('should allow partial credential updates', () => {
      const data = {
        name: 'Updated Name',
      };
      expect(UpdateDataSourceRequestSchema.safeParse(data).success).toBe(true);
    });

    it('should allow credential-only update', () => {
      const data = {
        type: 'postgres',
        password: 'new-password',
      };
      expect(UpdateDataSourceRequestSchema.safeParse(data).success).toBe(true);
    });

    it('should allow full update', () => {
      const data = {
        name: 'New Name',
        type: 'postgres',
        host: 'newhost.com',
        port: 5433,
        username: 'newuser',
        password: 'newpass',
        default_database: 'newdb',
      };
      expect(UpdateDataSourceRequestSchema.safeParse(data).success).toBe(true);
    });

    it('should allow updating just the host', () => {
      const data = {
        type: 'postgres',
        host: 'newhost.com',
      };
      expect(UpdateDataSourceRequestSchema.safeParse(data).success).toBe(true);
    });

    it('should allow empty update object', () => {
      const data = {};
      expect(UpdateDataSourceRequestSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('ListDataSourcesQuerySchema', () => {
    it('should use default values for pagination', () => {
      const data = {};
      const result = ListDataSourcesQuerySchema.parse(data);
      expect(result.page).toBe(0);
      expect(result.pageSize).toBe(25);
    });

    it('should validate custom pagination values', () => {
      const data = { page: '2', pageSize: '50' };
      const result = ListDataSourcesQuerySchema.parse(data);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(50);
    });

    it('should coerce string numbers to integers', () => {
      const data = { page: '1', pageSize: '10' };
      const result = ListDataSourcesQuerySchema.parse(data);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should reject negative page number', () => {
      const data = { page: '-1' };
      expect(ListDataSourcesQuerySchema.safeParse(data).success).toBe(false);
    });

    it('should reject pageSize above max', () => {
      const data = { pageSize: '101' };
      expect(ListDataSourcesQuerySchema.safeParse(data).success).toBe(false);
    });

    it('should reject pageSize below min', () => {
      const data = { pageSize: '0' };
      expect(ListDataSourcesQuerySchema.safeParse(data).success).toBe(false);
    });
  });
});
