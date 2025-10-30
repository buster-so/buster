import type {
  BigQueryCredentials,
  MotherDuckCredentials,
  SnowflakeCredentials,
} from '@buster/database/schema-types';
import { DataSourceType } from '@buster/database/schema-types';
import { load as yamlLoad } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { buildOutput, buildProfilesYaml } from './build-dbt-profiles-yaml';

describe('buildOutput', () => {
  describe('MotherDuck', () => {
    it('should build duckdb output with motherduck connection string', () => {
      const creds: MotherDuckCredentials = {
        type: DataSourceType.MotherDuck,
        token: 'test_token_123',
        default_database: 'test_db',
      };

      const output = buildOutput(creds);

      expect(output).toEqual({
        type: 'duckdb',
        path: 'md:test_db?motherduck_token=test_token_123',
        threads: 4,
        extensions: ['httpfs', 'parquet'],
      });
    });
  });
});

describe('buildProfilesYaml', () => {
  describe('MotherDuck', () => {
    it('should generate valid YAML for MotherDuck connection', () => {
      const creds: MotherDuckCredentials = {
        type: DataSourceType.MotherDuck,
        token: 'test_token_789',
        default_database: 'my_database',
      };

      const result = buildProfilesYaml({
        profileName: 'default',
        target: 'dev',
        creds,
      });

      // Parse the YAML to verify it's valid
      const parsed = yamlLoad(result.yaml) as Record<string, unknown>;

      expect(parsed).toHaveProperty('default');
      expect(parsed.default).toMatchObject({
        target: 'dev',
        outputs: {
          dev: {
            type: 'duckdb',
            path: 'md:my_database?motherduck_token=test_token_789',
            threads: 4,
            extensions: ['httpfs', 'parquet'],
          },
        },
      });

      // MotherDuck doesn't require key files
      expect(result.keyFiles).toEqual([]);
    });
  });

  describe('Snowflake with key-pair authentication', () => {
    it('should extract private key and generate valid YAML with file reference', () => {
      const privateKeyContent =
        '-----BEGIN PRIVATE KEY-----\nMOCK_KEY_CONTENT\n-----END PRIVATE KEY-----';
      const creds: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        auth_method: 'key_pair',
        account_id: 'ABC12345.us-central1.gcp',
        username: 'test_user',
        private_key: privateKeyContent,
        warehouse_id: 'COMPUTE_WH',
        default_database: 'TEST_DB',
      };

      const result = buildProfilesYaml({
        profileName: 'analytics',
        target: 'prod',
        creds,
        keysBasePath: '/custom/keys',
      });

      // Should have one key file
      expect(result.keyFiles).toHaveLength(1);
      expect(result.keyFiles[0]).toEqual({
        path: '/custom/keys/snowflake_private.key',
        content: privateKeyContent,
        permissions: '600',
      });

      // Parse the YAML
      const parsed = yamlLoad(result.yaml) as Record<string, unknown>;
      expect(parsed).toHaveProperty('analytics');
      expect(parsed.analytics).toMatchObject({
        target: 'prod',
        outputs: {
          prod: {
            type: 'snowflake',
            account: 'ABC12345.us-central1.gcp',
            user: 'test_user',
            private_key_path: '/custom/keys/snowflake_private.key',
            warehouse: 'COMPUTE_WH',
            database: 'TEST_DB',
          },
        },
      });
    });

    it('should not extract key file for password authentication', () => {
      const creds: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        auth_method: 'password',
        account_id: 'ABC12345.us-central1.gcp',
        username: 'test_user',
        password: 'test_password',
        warehouse_id: 'COMPUTE_WH',
        default_database: 'TEST_DB',
      };

      const result = buildProfilesYaml({
        profileName: 'analytics',
        target: 'dev',
        creds,
      });

      // Should have no key files
      expect(result.keyFiles).toEqual([]);

      // Parse the YAML - should have password, not private_key_path
      const parsed = yamlLoad(result.yaml) as Record<string, unknown>;
      const output = (parsed.analytics as any).outputs.dev;
      expect(output).toHaveProperty('password', 'test_password');
      expect(output).not.toHaveProperty('private_key_path');
    });
  });

  describe('BigQuery with service account key', () => {
    it('should extract service account key from string and generate valid YAML', () => {
      const serviceAccountKey = '{"type":"service_account","project_id":"test-project"}';
      const creds: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'test-project',
        service_account_key: serviceAccountKey,
        default_dataset: 'analytics',
      };

      const result = buildProfilesYaml({
        profileName: 'bq_profile',
        target: 'prod',
        creds,
        keysBasePath: '/workspace/.keys',
      });

      // Should have one key file
      expect(result.keyFiles).toHaveLength(1);
      expect(result.keyFiles[0]).toEqual({
        path: '/workspace/.keys/bigquery_service_account.json',
        content: serviceAccountKey,
        permissions: '600',
      });

      // Parse the YAML
      const parsed = yamlLoad(result.yaml) as Record<string, unknown>;
      expect(parsed.bq_profile).toMatchObject({
        target: 'prod',
        outputs: {
          prod: {
            type: 'bigquery',
            method: 'service-account',
            project: 'test-project',
            dataset: 'analytics',
            keyfile: '/workspace/.keys/bigquery_service_account.json',
          },
        },
      });
    });

    it('should extract service account key from object and generate valid YAML', () => {
      const serviceAccountKeyObj = {
        type: 'service_account',
        project_id: 'test-project',
        private_key_id: 'key123',
      };
      const creds: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'test-project',
        service_account_key: serviceAccountKeyObj,
        default_dataset: 'analytics',
      };

      const result = buildProfilesYaml({
        profileName: 'bq_profile',
        target: 'dev',
        creds,
      });

      // Should have one key file with JSON stringified content
      expect(result.keyFiles).toHaveLength(1);
      expect(result.keyFiles[0].path).toBe('/workspace/.keys/bigquery_service_account.json');
      expect(result.keyFiles[0].content).toBe(JSON.stringify(serviceAccountKeyObj, null, 2));
      expect(result.keyFiles[0].permissions).toBe('600');
    });

    it('should use existing key_file_path if provided', () => {
      const creds: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'test-project',
        key_file_path: '/existing/path/to/key.json',
        default_dataset: 'analytics',
      };

      const result = buildProfilesYaml({
        profileName: 'bq_profile',
        target: 'prod',
        creds,
      });

      // Should not extract key file
      expect(result.keyFiles).toEqual([]);

      // Parse the YAML - should use the existing path
      const parsed = yamlLoad(result.yaml) as Record<string, unknown>;
      expect(parsed.bq_profile).toMatchObject({
        target: 'prod',
        outputs: {
          prod: {
            type: 'bigquery',
            keyfile: '/existing/path/to/key.json',
          },
        },
      });
    });

    it('should handle missing service account key gracefully', () => {
      const creds: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'test-project',
        default_dataset: 'analytics',
      };

      const result = buildProfilesYaml({
        profileName: 'bq_profile',
        target: 'dev',
        creds,
      });

      // Should not extract key file
      expect(result.keyFiles).toEqual([]);
    });
  });

  describe('Multiple credential types', () => {
    it('should use default keysBasePath when not provided', () => {
      const creds: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        auth_method: 'key_pair',
        account_id: 'ABC12345',
        username: 'test_user',
        private_key: 'mock_key',
      };

      const result = buildProfilesYaml({
        profileName: 'default',
        target: 'dev',
        creds,
      });

      expect(result.keyFiles[0].path).toBe('/workspace/.keys/snowflake_private.key');
    });
  });
});
