import { DataSourceType, type SnowflakeCredentials } from '@buster/database/schema-types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SnowflakeAdapter } from './snowflake';

// Helper to determine if tests should run
const shouldRunTests = () => {
  const required = [
    'TEST_SNOWFLAKE_ACCOUNT_ID',
    'TEST_SNOWFLAKE_USERNAME',
    'TEST_SNOWFLAKE_PASSWORD',
    'TEST_SNOWFLAKE_DATABASE',
  ];

  return required.every((key) => process.env[key]);
};

const testIt = shouldRunTests() ? it : it.skip;

describe('snowflake-numeric-normalization.int.test.ts', () => {
  let adapter: SnowflakeAdapter;
  const TEST_TIMEOUT = 60000; // 60 seconds for Snowflake operations

  beforeEach(() => {
    adapter = new SnowflakeAdapter();
  });

  afterEach(async () => {
    if (adapter) {
      await adapter.close();
    }
  });

  testIt(
    'should normalize numeric strings to JavaScript numbers',
    async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: process.env.TEST_SNOWFLAKE_ACCOUNT_ID!,
        warehouse_id: process.env.TEST_SNOWFLAKE_WAREHOUSE_ID || 'COMPUTE_WH',
        default_database: process.env.TEST_SNOWFLAKE_DATABASE!,
        default_schema: process.env.TEST_SNOWFLAKE_SCHEMA || 'PUBLIC',
        username: process.env.TEST_SNOWFLAKE_USERNAME!,
        password: process.env.TEST_SNOWFLAKE_PASSWORD!,
        role: process.env.TEST_SNOWFLAKE_ROLE,
      };

      await adapter.initialize(credentials);

      // Query that returns various numeric types that Snowflake typically returns as strings
      const result = await adapter.query(`
        SELECT 
          1.500::DECIMAL(10,3) as commission_rate_pct,
          4251368.5497::DECIMAL(15,4) as salesytd,
          100::INTEGER as quantity,
          -45.67::FLOAT as negative_value,
          0.00::DECIMAL(10,2) as zero_decimal,
          3.14159::DOUBLE as pi_value,
          'Widget XL' as product_name,
          CURRENT_DATE() as order_date,
          TRUE as is_active
      `);

      expect(result.rows).toHaveLength(1);
      const row = result.rows[0];

      // Verify field metadata has correct normalized types
      const fieldMap = Object.fromEntries(result.fields.map((f) => [f.name, f.type]));
      expect(fieldMap.commission_rate_pct).toBe('decimal');
      expect(fieldMap.salesytd).toBe('decimal');
      expect(fieldMap.quantity).toBe('integer');
      expect(fieldMap.negative_value).toBe('float');
      expect(fieldMap.zero_decimal).toBe('decimal');
      expect(fieldMap.pi_value).toBe('double');
      expect(fieldMap.product_name).toBe('text');
      expect(fieldMap.order_date).toBe('date');
      expect(fieldMap.is_active).toBe('boolean');

      // Verify numeric values are JavaScript numbers, not strings
      expect(typeof row.commission_rate_pct).toBe('number');
      expect(row.commission_rate_pct).toBe(1.5); // Should be normalized from "1.500"

      expect(typeof row.salesytd).toBe('number');
      expect(row.salesytd).toBe(4251368.5497);

      expect(typeof row.quantity).toBe('number');
      expect(row.quantity).toBe(100);

      expect(typeof row.negative_value).toBe('number');
      expect(row.negative_value).toBeCloseTo(-45.67);

      expect(typeof row.zero_decimal).toBe('number');
      expect(row.zero_decimal).toBe(0);

      expect(typeof row.pi_value).toBe('number');
      expect(row.pi_value).toBeCloseTo(Math.PI, 5);

      // Verify non-numeric values remain as expected types
      expect(typeof row.product_name).toBe('string');
      expect(row.product_name).toBe('Widget XL');

      // Date should be converted to Date object
      expect(row.order_date).toBeInstanceOf(Date);

      // Boolean should be boolean (Snowflake returns as boolean or 1/0)
      expect(typeof row.is_active).toBe('boolean');
      expect(row.is_active).toBe(true);
    },
    TEST_TIMEOUT
  );

  testIt(
    'should handle large numbers correctly',
    async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: process.env.TEST_SNOWFLAKE_ACCOUNT_ID!,
        warehouse_id: process.env.TEST_SNOWFLAKE_WAREHOUSE_ID || 'COMPUTE_WH',
        default_database: process.env.TEST_SNOWFLAKE_DATABASE!,
        default_schema: process.env.TEST_SNOWFLAKE_SCHEMA || 'PUBLIC',
        username: process.env.TEST_SNOWFLAKE_USERNAME!,
        password: process.env.TEST_SNOWFLAKE_PASSWORD!,
        role: process.env.TEST_SNOWFLAKE_ROLE,
      };

      await adapter.initialize(credentials);

      // Test with numbers at JavaScript's precision limits
      const result = await adapter.query(`
        SELECT 
          9007199254740991::BIGINT as max_safe_integer,
          -9007199254740991::BIGINT as min_safe_integer,
          0.1::DECIMAL(10,10) as small_decimal,
          999999999999.999999::DECIMAL(18,6) as large_decimal
      `);

      expect(result.rows).toHaveLength(1);
      const row = result.rows[0];

      // All should be numbers
      expect(typeof row.max_safe_integer).toBe('number');
      expect(row.max_safe_integer).toBe(Number.MAX_SAFE_INTEGER);

      expect(typeof row.min_safe_integer).toBe('number');
      expect(row.min_safe_integer).toBe(Number.MIN_SAFE_INTEGER);

      expect(typeof row.small_decimal).toBe('number');
      expect(row.small_decimal).toBeCloseTo(0.1);

      expect(typeof row.large_decimal).toBe('number');
      expect(row.large_decimal).toBeCloseTo(1000000000000);
    },
    TEST_TIMEOUT
  );

  testIt(
    'should handle real-world scatter plot data correctly',
    async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: process.env.TEST_SNOWFLAKE_ACCOUNT_ID!,
        warehouse_id: process.env.TEST_SNOWFLAKE_WAREHOUSE_ID || 'COMPUTE_WH',
        default_database: process.env.TEST_SNOWFLAKE_DATABASE!,
        default_schema: process.env.TEST_SNOWFLAKE_SCHEMA || 'PUBLIC',
        username: process.env.TEST_SNOWFLAKE_USERNAME!,
        password: process.env.TEST_SNOWFLAKE_PASSWORD!,
        role: process.env.TEST_SNOWFLAKE_ROLE,
      };

      await adapter.initialize(credentials);

      // Simulate a real scatter plot query with X and Y numeric axes
      const result = await adapter.query(`
        WITH scatter_data AS (
          SELECT 1.5::DECIMAL(5,2) as x_axis, 4251368.55::DECIMAL(15,2) as y_axis, 'Point A' as label
          UNION ALL
          SELECT 2.75::DECIMAL(5,2), 3500000.00::DECIMAL(15,2), 'Point B'
          UNION ALL
          SELECT 0.5::DECIMAL(5,2), 5000000.99::DECIMAL(15,2), 'Point C'
        )
        SELECT x_axis, y_axis, label FROM scatter_data ORDER BY x_axis
      `);

      expect(result.rows).toHaveLength(3);

      // All X and Y values should be numbers for scatter plot to work
      result.rows.forEach((row) => {
        expect(typeof row.x_axis).toBe('number');
        expect(typeof row.y_axis).toBe('number');
        expect(typeof row.label).toBe('string');
      });

      // Verify specific values
      expect(result.rows[0].x_axis).toBe(0.5);
      expect(result.rows[0].y_axis).toBe(5000000.99);
      expect(result.rows[0].label).toBe('Point C');

      expect(result.rows[1].x_axis).toBe(1.5);
      expect(result.rows[1].y_axis).toBe(4251368.55);
      expect(result.rows[1].label).toBe('Point A');

      expect(result.rows[2].x_axis).toBe(2.75);
      expect(result.rows[2].y_axis).toBe(3500000);
      expect(result.rows[2].label).toBe('Point B');
    },
    TEST_TIMEOUT
  );
});
