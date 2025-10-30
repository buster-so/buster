import type { MotherDuckCredentials } from '@buster/database/schema-types';
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
  it('should generate valid YAML for MotherDuck connection', () => {
    const creds: MotherDuckCredentials = {
      type: DataSourceType.MotherDuck,
      token: 'test_token_789',
      default_database: 'my_database',
    };

    const yaml = buildProfilesYaml({
      profileName: 'default',
      target: 'dev',
      creds,
    });

    // Parse the YAML to verify it's valid
    const parsed = yamlLoad(yaml) as Record<string, unknown>;

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
  });
});
