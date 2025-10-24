/**
 * Integration tests for MotherDuck adapter
 * Tests against real MotherDuck instance with sample_data database
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DataSourceType, type MotherDuckCredentials } from '../types/credentials';
import { MotherDuckAdapter } from './motherduck';

// Check if MotherDuck test credentials are available
const hasMotherDuckCredentials = !!process.env.TEST_MOTHERDUCK_TOKEN;

// Skip tests if credentials are not available
const testIt = hasMotherDuckCredentials ? it : it.skip;

// Test timeout - 30 seconds for MotherDuck cloud queries
const TEST_TIMEOUT = 30000;

describe('MotherDuck Integration Tests', () => {
  let adapter: MotherDuckAdapter;

  const getCredentials = (): MotherDuckCredentials => ({
    type: DataSourceType.MotherDuck,
    token: process.env.TEST_MOTHERDUCK_TOKEN!,
    default_database: 'sample_data',
    // saas_mode defaults to true for server-side security
  });

  beforeEach(() => {
    adapter = new MotherDuckAdapter();
  });

  afterEach(async () => {
    if (adapter) {
      await adapter.close();
    }
  });

  describe('connection', () => {
    testIt(
      'should connect to MotherDuck with saas_mode=true (default)',
      async () => {
        const credentials = getCredentials();
        await adapter.initialize(credentials);
        expect(adapter.connected).toBe(true);
      },
      TEST_TIMEOUT
    );

    testIt(
      'should test connection returns true',
      async () => {
        const credentials = getCredentials();
        await adapter.initialize(credentials);
        const isConnected = await adapter.testConnection();
        expect(isConnected).toBe(true);
      },
      TEST_TIMEOUT
    );
  });

  describe('connection modes', () => {
    testIt(
      'should connect with explicit saas_mode=true',
      async () => {
        const saasAdapter = new MotherDuckAdapter();
        await saasAdapter.initialize({
          ...getCredentials(),
          saas_mode: true,
        });
        expect(saasAdapter.connected).toBe(true);
        await saasAdapter.close();
      },
      TEST_TIMEOUT
    );

    testIt(
      'should connect with saas_mode=false',
      async () => {
        const nonSaasAdapter = new MotherDuckAdapter();
        await nonSaasAdapter.initialize({
          ...getCredentials(),
          saas_mode: false,
        });
        expect(nonSaasAdapter.connected).toBe(true);
        await nonSaasAdapter.close();
      },
      TEST_TIMEOUT
    );
  });

  describe('sample_data database - hacker news dataset', () => {
    testIt(
      'should query hn.hacker_news table',
      async () => {
        await adapter.initialize(getCredentials());
        const result = await adapter.query(
          `SELECT id, type, "by", time FROM sample_data.hn.hacker_news LIMIT 5`
        );

        expect(result.rowCount).toBe(5);
        expect(result.fields.length).toBeGreaterThan(0);
        expect(result.fields.some((f) => f.name === 'id')).toBe(true);
        expect(result.rows.length).toBe(5);
      },
      TEST_TIMEOUT
    );

    testIt(
      'should handle aggregation queries',
      async () => {
        await adapter.initialize(getCredentials());
        const result = await adapter.query(`
          SELECT type, COUNT(*) as item_count
          FROM sample_data.hn.hacker_news
          GROUP BY type
          ORDER BY item_count DESC
        `);

        expect(result.rowCount).toBeGreaterThan(0);
        expect(result.fields.some((f) => f.name === 'type')).toBe(true);
      },
      TEST_TIMEOUT
    );
  });

  describe('query execution features', () => {
    testIt(
      'should enforce maxRows limit',
      async () => {
        await adapter.initialize(getCredentials());
        const maxRows = 50;
        const result = await adapter.query(
          'SELECT * FROM sample_data.hn.hacker_news',
          undefined,
          maxRows
        );

        expect(result.rowCount).toBeLessThanOrEqual(maxRows);
        expect(result.hasMoreRows).toBe(true);
      },
      TEST_TIMEOUT
    );

    testIt(
      'should handle empty result sets',
      async () => {
        await adapter.initialize(getCredentials());
        const result = await adapter.query(`SELECT * FROM sample_data.hn.hacker_news WHERE 1 = 0`);

        expect(result.rowCount).toBe(0);
        expect(result.rows).toEqual([]);
        expect(result.hasMoreRows).toBe(false);
      },
      TEST_TIMEOUT
    );
  });

  describe('introspection', () => {
    testIt(
      'should introspect databases',
      async () => {
        await adapter.initialize(getCredentials());
        const introspector = adapter.introspect();
        const databases = await introspector.getDatabases();

        expect(databases.length).toBeGreaterThan(0);
        expect(databases.some((db) => db.name === 'sample_data')).toBe(true);
      },
      TEST_TIMEOUT
    );

    testIt(
      'should introspect schemas',
      async () => {
        await adapter.initialize(getCredentials());
        const introspector = adapter.introspect();
        const schemas = await introspector.getSchemas('sample_data');

        expect(schemas.length).toBeGreaterThan(0);
        const schemaNames = schemas.map((s) => s.name);
        expect(schemaNames).toContain('hn');
      },
      TEST_TIMEOUT
    );

    testIt(
      'should introspect tables',
      async () => {
        await adapter.initialize(getCredentials());
        const introspector = adapter.introspect();
        const tables = await introspector.getTables('sample_data', 'hn');

        expect(tables.length).toBeGreaterThan(0);
        expect(tables.some((t) => t.name === 'hacker_news')).toBe(true);
      },
      TEST_TIMEOUT
    );
  });

  describe('error handling', () => {
    testIt(
      'should handle syntax errors',
      async () => {
        await adapter.initialize(getCredentials());
        await expect(adapter.query('SELECT * FROM nonexistent_table')).rejects.toThrow();
      },
      TEST_TIMEOUT
    );

    testIt(
      'should handle invalid SQL',
      async () => {
        await adapter.initialize(getCredentials());
        await expect(adapter.query('INVALID SQL STATEMENT')).rejects.toThrow();
      },
      TEST_TIMEOUT
    );
  });

  describe('DuckDB features', () => {
    testIt(
      'should support array functions',
      async () => {
        await adapter.initialize(getCredentials());
        const result = await adapter.query(
          `SELECT ['a', 'b', 'c'] as array_col, len(['a', 'b', 'c']) as array_length`
        );

        expect(result.rowCount).toBe(1);
        expect(result.rows[0].array_length).toBe(3);
      },
      TEST_TIMEOUT
    );
  });

  describe('authentication', () => {
    testIt(
      'should reject invalid token',
      async () => {
        const invalidAdapter = new MotherDuckAdapter();
        const invalidCredentials: MotherDuckCredentials = {
          type: DataSourceType.MotherDuck,
          token: 'invalid_token_12345',
          default_database: 'sample_data',
        };

        await expect(invalidAdapter.initialize(invalidCredentials)).rejects.toThrow();
      },
      TEST_TIMEOUT
    );
  });
});
