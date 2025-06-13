import { beforeEach, describe, expect, it } from 'vitest';
import { DataSource } from '../../src/data-source';
import { DataSourceType } from '../../src/types/credentials';

// Helper to create test data source configurations
function createTestDataSource(type: DataSourceType) {
  const configs: Record<string, any> = {
    [DataSourceType.PostgreSQL]: {
      name: 'test-postgres-limiting',
      type: DataSourceType.PostgreSQL,
      credentials: {
        type: DataSourceType.PostgreSQL,
        host: process.env.TEST_POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.TEST_POSTGRES_PORT || '5432'),
        database: process.env.TEST_POSTGRES_DATABASE || 'test',
        username: process.env.TEST_POSTGRES_USERNAME || 'postgres',
        password: process.env.TEST_POSTGRES_PASSWORD || 'postgres',
      },
    },
    [DataSourceType.MySQL]: {
      name: 'test-mysql-limiting',
      type: DataSourceType.MySQL,
      credentials: {
        type: DataSourceType.MySQL,
        host: process.env.TEST_MYSQL_HOST || 'localhost',
        port: parseInt(process.env.TEST_MYSQL_PORT || '3306'),
        database: process.env.TEST_MYSQL_DATABASE || 'test',
        username: process.env.TEST_MYSQL_USERNAME || 'root',
        password: process.env.TEST_MYSQL_PASSWORD || 'password',
      },
    },
  };

  return configs[type];
}

describe('MaxRows Limiting Integration Tests', () => {
  describe.skipIf(!process.env.TEST_POSTGRES_HOST)('PostgreSQL MaxRows Limiting', () => {
    let dataSource: DataSource;

    beforeEach(async () => {
      dataSource = new DataSource({
        dataSources: [createTestDataSource(DataSourceType.PostgreSQL)],
      });

      // Create test table with known data
      await dataSource.execute({
        sql: 'DROP TABLE IF EXISTS test_limiting',
      });
      
      await dataSource.execute({
        sql: `CREATE TABLE test_limiting (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100),
          value INT
        )`,
      });

      // Insert 100 test rows
      const values = Array.from({ length: 100 }, (_, i) => `(${i + 1}, 'Row ${i + 1}', ${(i + 1) * 10})`).join(',');
      await dataSource.execute({
        sql: `INSERT INTO test_limiting (id, name, value) VALUES ${values}`,
      });
    });

    it('should limit results to exactly 1 row when maxRows=1', async () => {
      const result = await dataSource.execute({
        sql: 'SELECT * FROM test_limiting ORDER BY id',
        options: { maxRows: 1 },
      });

      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(1);
      expect(result.rows?.[0]).toMatchObject({
        id: 1,
        name: 'Row 1',
        value: 10,
      });
      expect(result.metadata?.limited).toBe(true);
      expect(result.metadata?.maxRows).toBe(1);
    });

    it('should limit results to exactly 5 rows when maxRows=5', async () => {
      const result = await dataSource.execute({
        sql: 'SELECT * FROM test_limiting ORDER BY id',
        options: { maxRows: 5 },
      });

      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(5);
      expect(result.rows?.[0]).toMatchObject({ id: 1, name: 'Row 1' });
      expect(result.rows?.[4]).toMatchObject({ id: 5, name: 'Row 5' });
      expect(result.metadata?.limited).toBe(true);
    });

    it('should work with complex queries (CTEs)', async () => {
      const result = await dataSource.execute({
        sql: `
          WITH numbered_rows AS (
            SELECT *, ROW_NUMBER() OVER (ORDER BY value DESC) as rn
            FROM test_limiting
          )
          SELECT * FROM numbered_rows WHERE rn <= 50
        `,
        options: { maxRows: 3 },
      });

      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(3);
      expect(result.metadata?.limited).toBe(true);
    });

    it('should work with UNION queries', async () => {
      const result = await dataSource.execute({
        sql: `
          SELECT id, name FROM test_limiting WHERE id <= 10
          UNION ALL
          SELECT id, name FROM test_limiting WHERE id > 90
          ORDER BY id
        `,
        options: { maxRows: 5 },
      });

      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(5);
      expect(result.metadata?.limited).toBe(true);
    });

    it('should return all rows when result set is smaller than maxRows', async () => {
      const result = await dataSource.execute({
        sql: 'SELECT * FROM test_limiting WHERE id <= 3 ORDER BY id',
        options: { maxRows: 10 },
      });

      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(3);
      expect(result.metadata?.limited).toBe(false); // No more rows available
    });
  });

  describe.skipIf(!process.env.TEST_MYSQL_HOST)('MySQL MaxRows Limiting', () => {
    let dataSource: DataSource;

    beforeEach(async () => {
      dataSource = new DataSource({
        dataSources: [createTestDataSource(DataSourceType.MySQL)],
      });

      // Create test table with known data
      await dataSource.execute({
        sql: 'DROP TABLE IF EXISTS test_limiting',
      });
      
      await dataSource.execute({
        sql: `CREATE TABLE test_limiting (
          id INT PRIMARY KEY,
          name VARCHAR(100),
          value INT
        )`,
      });

      // Insert test rows one by one (MySQL doesn't support multi-row VALUES in older versions)
      for (let i = 1; i <= 20; i++) {
        await dataSource.execute({
          sql: 'INSERT INTO test_limiting (id, name, value) VALUES (?, ?, ?)',
          params: [i, `Row ${i}`, i * 10],
        });
      }
    });

    it('should limit results to exactly 1 row when maxRows=1', async () => {
      const result = await dataSource.execute({
        sql: 'SELECT * FROM test_limiting ORDER BY id',
        options: { maxRows: 1 },
      });

      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(1);
      expect(result.rows?.[0]).toMatchObject({
        id: 1,
        name: 'Row 1',
        value: 10,
      });
      expect(result.metadata?.limited).toBe(true);
    });

    it('should work with complex queries', async () => {
      // MySQL 5.7 doesn't support CTEs, so we use a subquery
      const result = await dataSource.execute({
        sql: `
          SELECT * FROM (
            SELECT *, @row_num := @row_num + 1 AS rn
            FROM test_limiting, (SELECT @row_num := 0) AS init
            ORDER BY value DESC
          ) AS numbered
          WHERE rn <= 10
        `,
        options: { maxRows: 3 },
      });

      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(3);
      expect(result.metadata?.limited).toBe(true);
    });
  });
});