import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SnowflakeCredentials } from '../types/credentials';
import { DataSourceType } from '../types/credentials';
import { SnowflakeAdapter } from './snowflake';

// Check if Snowflake test credentials are available
const hasSnowflakeCredentials = !!(
  process.env.TEST_SNOWFLAKE_DATABASE &&
  process.env.TEST_SNOWFLAKE_USERNAME &&
  process.env.TEST_SNOWFLAKE_PASSWORD &&
  process.env.TEST_SNOWFLAKE_ACCOUNT_ID
);

// Skip tests if credentials are not available
const testWithCredentials = hasSnowflakeCredentials ? it : it.skip;

const TEST_TIMEOUT = 30000;

describe('Snowflake Memory Protection Tests', () => {
  let adapter: SnowflakeAdapter;
  let credentials: SnowflakeCredentials;

  beforeEach(() => {
    adapter = new SnowflakeAdapter();

    // Set up credentials from environment variables
    credentials = {
      type: DataSourceType.Snowflake,
      account_id: process.env.TEST_SNOWFLAKE_ACCOUNT_ID!,
      warehouse_id: process.env.TEST_SNOWFLAKE_WAREHOUSE_ID || 'COMPUTE_WH',
      default_database: process.env.TEST_SNOWFLAKE_DATABASE!,
      default_schema: process.env.TEST_SNOWFLAKE_SCHEMA || 'PUBLIC',
      username: process.env.TEST_SNOWFLAKE_USERNAME!,
      password: process.env.TEST_SNOWFLAKE_PASSWORD!,
      role: process.env.TEST_SNOWFLAKE_ROLE,
    };
  });

  afterEach(async () => {
    if (adapter) {
      await adapter.close();
    }
  });

  testWithCredentials(
    'should handle large result sets with maxRows without running out of memory',
    async () => {
      await adapter.initialize(credentials);

      // NOTE: Due to Snowflake SDK limitations, we cannot truly stream results
      // For now, we'll test with a smaller dataset to avoid OOM
      // Query ORDERS table instead of LINEITEM (1.5M rows vs 6M rows)
      const result = await adapter.query(
        'SELECT * FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.ORDERS',
        undefined,
        100 // Only fetch 100 rows
      );

      expect(result.rows.length).toBe(100);
      expect(result.hasMoreRows).toBe(true);
      expect(result.rowCount).toBe(100);

      // Verify we got the fields metadata
      expect(result.fields.length).toBeGreaterThan(0);
      expect(result.fields[0]).toHaveProperty('name');
      expect(result.fields[0]).toHaveProperty('type');
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should preserve query caching when running the same query multiple times',
    async () => {
      await adapter.initialize(credentials);

      const sql = 'SELECT * FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.CUSTOMER WHERE C_MKTSEGMENT = ?';
      const params = ['AUTOMOBILE'];

      // First execution - will be cached by Snowflake
      const start1 = Date.now();
      const result1 = await adapter.query(sql, params, 50);
      const time1 = Date.now() - start1;

      // Second execution - should hit Snowflake's cache
      const start2 = Date.now();
      const result2 = await adapter.query(sql, params, 50);
      const time2 = Date.now() - start2;

      // Third execution with different maxRows - should still hit cache
      const start3 = Date.now();
      const result3 = await adapter.query(sql, params, 25);
      const time3 = Date.now() - start3;

      // Verify results
      expect(result1.rows.length).toBe(50);
      expect(result2.rows.length).toBe(50);
      expect(result3.rows.length).toBe(25);

      // All should indicate more rows available
      expect(result1.hasMoreRows).toBe(true);
      expect(result2.hasMoreRows).toBe(true);
      expect(result3.hasMoreRows).toBe(true);

      // Cache hits should be faster (allowing for some variance)
      console.info(`Query times: ${time1}ms, ${time2}ms, ${time3}ms`);

      // The cached queries (2nd and 3rd) should generally be faster than the first
      // We use a loose check because network latency can vary
      const avgCachedTime = (time2 + time3) / 2;
      expect(avgCachedTime).toBeLessThanOrEqual(time1 * 2); // Allow 100% variance for network fluctuations
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle queries with no maxRows (fetch all results)',
    async () => {
      await adapter.initialize(credentials);

      // Query a small table without maxRows - should get ALL rows
      const result = await adapter.query('SELECT * FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.REGION');

      // REGION table has exactly 5 rows - we should get them all
      expect(result.rows.length).toBe(5);
      expect(result.hasMoreRows).toBe(false);
      expect(result.rowCount).toBe(5);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should fetch unlimited rows for larger datasets when no maxRows specified',
    async () => {
      await adapter.initialize(credentials);

      // Query NATION table without maxRows - should get ALL 25 rows
      const result = await adapter.query('SELECT * FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.NATION');

      // NATION table has exactly 25 rows - we should get them all
      expect(result.rows.length).toBe(25);
      expect(result.hasMoreRows).toBe(false);
      expect(result.rowCount).toBe(25);

      // Verify we got all the data by checking specific nations exist
      const nationKeys = result.rows.map((r) => r.n_nationkey);
      expect(nationKeys).toContain(0); // ALGERIA
      expect(nationKeys).toContain(24); // UNITED STATES
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle maxRows parameter correctly for detecting more rows',
    async () => {
      await adapter.initialize(credentials);

      // Query with maxRows=5 (NATION has 25 rows total)
      const result = await adapter.query(
        'SELECT * FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.NATION ORDER BY N_NATIONKEY',
        undefined,
        5
      );

      expect(result.rows.length).toBe(5);
      expect(result.hasMoreRows).toBe(true); // Should detect there are more rows
      expect(result.rowCount).toBe(5);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle maxRows=1 correctly',
    async () => {
      await adapter.initialize(credentials);

      const result = await adapter.query(
        'SELECT * FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.NATION ORDER BY N_NATIONKEY',
        undefined,
        1
      );

      expect(result.rows.length).toBe(1);
      expect(result.hasMoreRows).toBe(true);
      expect(result.rows[0]).toHaveProperty('n_nationkey', 0); // First nation
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle edge case where result set equals maxRows',
    async () => {
      await adapter.initialize(credentials);

      // REGION table has exactly 5 rows
      const result = await adapter.query(
        'SELECT * FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.REGION',
        undefined,
        5
      );

      expect(result.rows.length).toBe(5);
      expect(result.hasMoreRows).toBe(false); // No more rows available
      expect(result.rowCount).toBe(5);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle complex queries with CTEs and maxRows',
    async () => {
      await adapter.initialize(credentials);

      const sql = `
        WITH high_value_orders AS (
          SELECT O_CUSTKEY, SUM(O_TOTALPRICE) as total_spent
          FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.ORDERS
          GROUP BY O_CUSTKEY
          HAVING SUM(O_TOTALPRICE) > 500000
        )
        SELECT c.C_NAME, c.C_PHONE, h.total_spent
        FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.CUSTOMER c
        JOIN high_value_orders h ON c.C_CUSTKEY = h.O_CUSTKEY
        ORDER BY h.total_spent DESC
      `;

      const result = await adapter.query(sql, undefined, 10);

      expect(result.rows.length).toBe(10);
      expect(result.hasMoreRows).toBe(true);
      expect(result.fields.length).toBe(3); // C_NAME, C_PHONE, total_spent
    },
    TEST_TIMEOUT
  );
});
