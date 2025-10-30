import { describe, expect, it } from 'vitest';
import type { Credentials } from './requests';
import { sanitizeCredentials } from './sanitize-credentials';

describe('sanitizeCredentials', () => {
  describe('Snowflake password authentication', () => {
    it('should redact password in Snowflake password auth credentials', () => {
      const credentials: Credentials = {
        type: 'snowflake',
        auth_method: 'password',
        account_id: 'ABC12345.us-central1.gcp',
        username: 'john.doe',
        password: 'super-secret-password',
        warehouse_id: 'COMPUTE_WH',
      };

      const sanitized = sanitizeCredentials(credentials);

      expect(sanitized.type).toBe('snowflake');
      expect(sanitized.auth_method).toBe('password');
      expect(sanitized.account_id).toBe('ABC12345.us-central1.gcp');
      expect(sanitized.username).toBe('john.doe');
      expect(sanitized.password).toBe('*****');
      expect(sanitized.warehouse_id).toBe('COMPUTE_WH');
    });

    it('should not mutate original credentials object', () => {
      const credentials: Credentials = {
        type: 'snowflake',
        auth_method: 'password',
        account_id: 'ABC12345',
        username: 'user',
        password: 'secret',
      };

      const original = { ...credentials };
      sanitizeCredentials(credentials);

      expect(credentials).toEqual(original);
      expect(credentials.password).toBe('secret');
    });
  });

  describe('Snowflake key-pair authentication', () => {
    it('should redact private_key and private_key_passphrase in Snowflake key-pair auth', () => {
      const credentials: Credentials = {
        type: 'snowflake',
        auth_method: 'key_pair',
        account_id: 'ABC12345.us-central1.gcp',
        username: 'john.doe',
        private_key:
          '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...',
        private_key_passphrase: 'my-passphrase',
        warehouse_id: 'COMPUTE_WH',
      };

      const sanitized = sanitizeCredentials(credentials);

      expect(sanitized.type).toBe('snowflake');
      expect(sanitized.auth_method).toBe('key_pair');
      expect(sanitized.account_id).toBe('ABC12345.us-central1.gcp');
      expect(sanitized.username).toBe('john.doe');
      expect(sanitized.private_key).toBe('*****');
      expect(sanitized.private_key_passphrase).toBe('*****');
      expect(sanitized.warehouse_id).toBe('COMPUTE_WH');
    });

    it('should handle missing passphrase in key-pair auth', () => {
      const credentials: Credentials = {
        type: 'snowflake',
        auth_method: 'key_pair',
        account_id: 'ABC12345',
        username: 'user',
        private_key: '-----BEGIN PRIVATE KEY-----...',
      };

      const sanitized = sanitizeCredentials(credentials);

      expect(sanitized.private_key).toBe('*****');
      expect(sanitized.private_key_passphrase).toBeUndefined();
    });
  });

  describe('PostgreSQL credentials', () => {
    it('should redact password in PostgreSQL credentials', () => {
      const credentials: Credentials = {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        default_database: 'mydb',
        username: 'postgres',
        password: 'postgres-password',
      };

      const sanitized = sanitizeCredentials(credentials);

      expect(sanitized.type).toBe('postgres');
      expect(sanitized.host).toBe('localhost');
      expect(sanitized.username).toBe('postgres');
      expect(sanitized.password).toBe('*****');
    });
  });

  describe('MySQL credentials', () => {
    it('should redact password in MySQL credentials', () => {
      const credentials: Credentials = {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        default_database: 'mydb',
        username: 'root',
        password: 'mysql-password',
      };

      const sanitized = sanitizeCredentials(credentials);

      expect(sanitized.type).toBe('mysql');
      expect(sanitized.host).toBe('localhost');
      expect(sanitized.username).toBe('root');
      expect(sanitized.password).toBe('*****');
    });
  });

  describe('SQL Server credentials', () => {
    it('should redact password in SQL Server credentials', () => {
      const credentials: Credentials = {
        type: 'sqlserver',
        host: 'localhost',
        port: 1433,
        default_database: 'master',
        username: 'sa',
        password: 'sqlserver-password',
      };

      const sanitized = sanitizeCredentials(credentials);

      expect(sanitized.type).toBe('sqlserver');
      expect(sanitized.host).toBe('localhost');
      expect(sanitized.username).toBe('sa');
      expect(sanitized.password).toBe('*****');
    });
  });

  describe('Redshift credentials', () => {
    it('should redact password in Redshift credentials', () => {
      const credentials: Credentials = {
        type: 'redshift',
        host: 'cluster.abc123.us-west-2.redshift.amazonaws.com',
        port: 5439,
        default_database: 'dev',
        username: 'admin',
        password: 'redshift-password',
      };

      const sanitized = sanitizeCredentials(credentials);

      expect(sanitized.type).toBe('redshift');
      expect(sanitized.host).toBe('cluster.abc123.us-west-2.redshift.amazonaws.com');
      expect(sanitized.username).toBe('admin');
      expect(sanitized.password).toBe('*****');
    });
  });

  describe('BigQuery credentials', () => {
    it('should redact service_account_key when it is a string', () => {
      const credentials: Credentials = {
        type: 'bigquery',
        project_id: 'my-project',
        service_account_key:
          '{"type":"service_account","project_id":"my-project","private_key":"-----BEGIN PRIVATE KEY-----..."}',
      };

      const sanitized = sanitizeCredentials(credentials);

      expect(sanitized.type).toBe('bigquery');
      expect(sanitized.project_id).toBe('my-project');
      expect(sanitized.service_account_key).toBe('*****');
    });

    it('should redact service_account_key when it is an object', () => {
      const credentials: Credentials = {
        type: 'bigquery',
        project_id: 'my-project',
        service_account_key: {
          type: 'service_account',
          project_id: 'my-project',
          private_key: '-----BEGIN PRIVATE KEY-----...',
        },
      };

      const sanitized = sanitizeCredentials(credentials);

      expect(sanitized.type).toBe('bigquery');
      expect(sanitized.project_id).toBe('my-project');
      expect(sanitized.service_account_key).toBe('*****');
    });

    it('should handle missing service_account_key', () => {
      const credentials: Credentials = {
        type: 'bigquery',
        project_id: 'my-project',
        key_file_path: '/path/to/key.json',
      };

      const sanitized = sanitizeCredentials(credentials);

      expect(sanitized.type).toBe('bigquery');
      expect(sanitized.project_id).toBe('my-project');
      expect(sanitized.key_file_path).toBe('/path/to/key.json');
      expect(sanitized.service_account_key).toBeUndefined();
    });
  });

  describe('MotherDuck credentials', () => {
    it('should redact token in MotherDuck credentials', () => {
      const credentials: Credentials = {
        type: 'motherduck',
        token: 'motherduck_token_abc123xyz',
        default_database: 'mydb',
      };

      const sanitized = sanitizeCredentials(credentials);

      expect(sanitized.type).toBe('motherduck');
      expect(sanitized.default_database).toBe('mydb');
      expect(sanitized.token).toBe('*****');
    });
  });

  describe('Edge cases', () => {
    it('should handle credentials with undefined sensitive fields', () => {
      const credentials: Credentials = {
        type: 'postgres',
        host: 'localhost',
        default_database: 'mydb',
        username: 'user',
        password: 'password',
      };

      // Remove password to test undefined
      const { password: _, ...credsWithoutPassword } = credentials;

      const sanitized = sanitizeCredentials(credsWithoutPassword as Credentials);

      expect(sanitized.password).toBeUndefined();
    });

    it('should preserve all non-sensitive fields', () => {
      const credentials: Credentials = {
        type: 'snowflake',
        auth_method: 'password',
        account_id: 'ABC12345',
        username: 'user',
        password: 'secret',
        warehouse_id: 'COMPUTE_WH',
        role: 'ANALYST',
        default_database: 'ANALYTICS',
        default_schema: 'PUBLIC',
        custom_host: 'custom.snowflakecomputing.com',
      };

      const sanitized = sanitizeCredentials(credentials);

      // Non-sensitive fields should be preserved
      expect(sanitized.account_id).toBe('ABC12345');
      expect(sanitized.username).toBe('user');
      expect(sanitized.warehouse_id).toBe('COMPUTE_WH');
      expect(sanitized.role).toBe('ANALYST');
      expect(sanitized.default_database).toBe('ANALYTICS');
      expect(sanitized.default_schema).toBe('PUBLIC');
      expect(sanitized.custom_host).toBe('custom.snowflakecomputing.com');

      // Sensitive field should be redacted
      expect(sanitized.password).toBe('*****');
    });
  });
});
