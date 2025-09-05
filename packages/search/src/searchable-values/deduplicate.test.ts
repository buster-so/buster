/**
 * Tests for DuckDB-based deduplication functionality
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type DuckDBConnection,
  batchArray,
  checkExistence,
  closeConnection,
  createConnection,
  deduplicateValues,
  escapeSqlString,
  executeQuery,
  formatSqlInClause,
  getDeduplicationStats,
} from './deduplicate';
import { type SearchableValue, createUniqueKey } from './types';

describe('Deduplication Utilities', () => {
  describe('batchArray', () => {
    it('should split array into batches of specified size', () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = batchArray(input, 3);

      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
    });

    it('should handle empty array', () => {
      const result = batchArray([], 5);
      expect(result).toEqual([]);
    });

    it('should handle batch size larger than array', () => {
      const input = [1, 2, 3];
      const result = batchArray(input, 10);
      expect(result).toEqual([[1, 2, 3]]);
    });
  });

  describe('escapeSqlString', () => {
    it('should escape single quotes', () => {
      expect(escapeSqlString("O'Reilly")).toBe("O''Reilly");
      expect(escapeSqlString("It's a test")).toBe("It''s a test");
    });

    it('should handle strings without quotes', () => {
      expect(escapeSqlString('normal string')).toBe('normal string');
    });

    it('should handle multiple quotes', () => {
      expect(escapeSqlString("''test''")).toBe("''''test''''");
    });
  });

  describe('formatSqlInClause', () => {
    it('should format values for SQL IN clause', () => {
      const values = ['apple', 'banana', 'cherry'];
      const result = formatSqlInClause(values);
      expect(result).toBe("'apple','banana','cherry'");
    });

    it('should escape quotes in values', () => {
      const values = ["O'Reilly", 'test'];
      const result = formatSqlInClause(values);
      expect(result).toBe("'O''Reilly','test'");
    });

    it('should handle empty array', () => {
      const result = formatSqlInClause([]);
      expect(result).toBe("('')");
    });
  });
});

describe('DuckDB Connection Management', () => {
  it('should create and close connection', async () => {
    const connection = await createConnection();

    expect(connection).toBeDefined();
    expect(connection.db).toBeDefined();
    expect(connection.conn).toBeDefined();

    // Should close without error
    await expect(closeConnection(connection)).resolves.toBeUndefined();
  });

  it('should execute queries', async () => {
    const connection = await createConnection();

    try {
      // Create a simple table
      await executeQuery(connection.conn, 'CREATE TABLE test (id INTEGER, name VARCHAR)');

      // Insert data
      await executeQuery(connection.conn, "INSERT INTO test VALUES (1, 'Alice'), (2, 'Bob')");

      // Query data
      const results = await executeQuery<{ id: number; name: string }>(
        connection.conn,
        'SELECT * FROM test ORDER BY id'
      );

      expect(results).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);
    } finally {
      await closeConnection(connection);
    }
  });

  it('should handle query errors', async () => {
    const connection = await createConnection();

    try {
      await expect(
        executeQuery(connection.conn, 'SELECT * FROM nonexistent_table')
      ).rejects.toThrow('DuckDB query failed');
    } finally {
      await closeConnection(connection);
    }
  });
});

describe('deduplicateValues', () => {
  const createTestValue = (
    database: string,
    table: string,
    column: string,
    value: string
  ): SearchableValue => ({
    database,
    schema: 'public',
    table,
    column,
    value,
  });

  it('should return all values when no existing keys', async () => {
    const newValues = [
      createTestValue('db1', 'users', 'name', 'Alice'),
      createTestValue('db1', 'users', 'name', 'Bob'),
      createTestValue('db1', 'users', 'email', 'alice@example.com'),
    ];

    const result = await deduplicateValues({
      existingKeys: [],
      newValues,
    });

    expect(result.newCount).toBe(3);
    expect(result.existingCount).toBe(0);
    expect(result.newValues).toEqual(newValues);
  });

  it('should filter out duplicate values', async () => {
    const existingValues = [
      createTestValue('db1', 'users', 'name', 'Alice'),
      createTestValue('db1', 'users', 'name', 'Bob'),
    ];

    const existingKeys = existingValues.map(createUniqueKey);

    const newValues = [
      createTestValue('db1', 'users', 'name', 'Alice'), // Duplicate
      createTestValue('db1', 'users', 'name', 'Bob'), // Duplicate
      createTestValue('db1', 'users', 'name', 'Charlie'), // New
      createTestValue('db1', 'users', 'email', 'charlie@example.com'), // New
    ];

    const result = await deduplicateValues({
      existingKeys,
      newValues,
    });

    expect(result.newCount).toBe(2);
    expect(result.existingCount).toBe(2);
    expect(result.newValues).toHaveLength(2);
    // Order might vary due to SQL, so just check both values are present
    const values = result.newValues.map((v) => v.value);
    expect(values).toContain('Charlie');
    expect(values).toContain('charlie@example.com');
  });

  it('should handle empty new values', async () => {
    const result = await deduplicateValues({
      existingKeys: ['key1', 'key2'],
      newValues: [],
    });

    expect(result.newCount).toBe(0);
    expect(result.existingCount).toBe(2);
    expect(result.newValues).toEqual([]);
  });

  it('should handle large datasets efficiently', async () => {
    // Create 5000 new values as SearchableValues (not just keys)
    const existingValues: SearchableValue[] = Array.from({ length: 5000 }, (_, i) => ({
      database: 'test',
      schema: 'public',
      table: 'test',
      column: 'col',
      value: `existing_key_${i}`,
    }));

    // Convert to unique keys for deduplication
    const existingKeys = existingValues.map(createUniqueKey);

    // Create 5000 new values, with 2500 duplicates
    const newValues: SearchableValue[] = [];

    // Add 2500 duplicates (matching existing keys)
    for (let i = 0; i < 2500; i++) {
      newValues.push({
        database: 'test',
        schema: 'public',
        table: 'test',
        column: 'col',
        value: `existing_key_${i}`,
      });
    }

    // Add 2500 new values
    for (let i = 0; i < 2500; i++) {
      newValues.push({
        database: 'test',
        schema: 'public',
        table: 'test',
        column: 'col',
        value: `new_key_${i}`,
      });
    }

    const startTime = Date.now();
    const result = await deduplicateValues({
      existingKeys,
      newValues,
    });
    const duration = Date.now() - startTime;

    expect(result.newCount).toBe(2500);
    expect(result.existingCount).toBe(5000);
    expect(result.newValues).toHaveLength(2500);

    // Should complete in reasonable time (less than 5 seconds)
    expect(duration).toBeLessThan(5000);
  });

  it('should handle special characters in values', async () => {
    const specialValues = [
      createTestValue('db', 'table', 'col', "O'Reilly"),
      createTestValue('db', 'table', 'col', 'Line\nBreak'),
      createTestValue('db', 'table', 'col', 'Tab\tCharacter'),
      createTestValue('db', 'table', 'col', '"Quoted"'),
      createTestValue('db', 'table', 'col', '💾 Emoji'),
    ];

    const result = await deduplicateValues({
      existingKeys: [],
      newValues: specialValues,
    });

    expect(result.newCount).toBe(5);
    expect(result.newValues).toEqual(specialValues);
  });

  it('should validate input with Zod', async () => {
    await expect(
      deduplicateValues({
        existingKeys: 'not-an-array' as any,
        newValues: [],
      })
    ).rejects.toThrow();

    await expect(
      deduplicateValues({
        existingKeys: [],
        newValues: [{ invalid: 'object' }] as any,
      })
    ).rejects.toThrow();
  });
});

describe('checkExistence', () => {
  const createTestValue = (value: string): SearchableValue => ({
    database: 'test',
    schema: 'public',
    table: 'users',
    column: 'name',
    value,
  });

  it('should check if values exist', async () => {
    const existingKeys = [
      createUniqueKey(createTestValue('Alice')),
      createUniqueKey(createTestValue('Bob')),
    ];

    const valuesToCheck = [
      createTestValue('Alice'), // Exists
      createTestValue('Charlie'), // Doesn't exist
      createTestValue('Bob'), // Exists
      createTestValue('David'), // Doesn't exist
    ];

    const result = await checkExistence(existingKeys, valuesToCheck);

    expect(result.get(createUniqueKey(createTestValue('Alice')))).toBe(true);
    expect(result.get(createUniqueKey(createTestValue('Bob')))).toBe(true);
    expect(result.get(createUniqueKey(createTestValue('Charlie')))).toBe(false);
    expect(result.get(createUniqueKey(createTestValue('David')))).toBe(false);
  });

  it('should handle empty existing keys', async () => {
    const valuesToCheck = [createTestValue('Alice'), createTestValue('Bob')];

    const result = await checkExistence([], valuesToCheck);

    for (const value of valuesToCheck) {
      expect(result.get(createUniqueKey(value))).toBe(false);
    }
  });

  it('should handle empty values to check', async () => {
    const result = await checkExistence(['key1', 'key2'], []);
    expect(result.size).toBe(0);
  });
});

describe('getDeduplicationStats', () => {
  const createTestValue = (value: string): SearchableValue => ({
    database: 'test',
    schema: 'public',
    table: 'users',
    column: 'name',
    value,
  });

  it('should calculate deduplication statistics', async () => {
    const existingKeys = [
      createUniqueKey(createTestValue('Alice')),
      createUniqueKey(createTestValue('Bob')),
    ];

    const newValues = [
      createTestValue('Alice'), // Duplicate
      createTestValue('Bob'), // Duplicate
      createTestValue('Charlie'), // New
      createTestValue('David'), // New
      createTestValue('Eve'), // New
    ];

    const stats = await getDeduplicationStats(existingKeys, newValues);

    expect(stats).toEqual({
      total: 5,
      unique: 3,
      duplicate: 2,
      percentage: 40, // 2/5 * 100
    });
  });

  it('should handle all duplicates', async () => {
    const values = [createTestValue('Alice'), createTestValue('Bob')];
    const existingKeys = values.map(createUniqueKey);

    const stats = await getDeduplicationStats(existingKeys, values);

    expect(stats).toEqual({
      total: 2,
      unique: 0,
      duplicate: 2,
      percentage: 100,
    });
  });

  it('should handle no duplicates', async () => {
    const newValues = [createTestValue('Alice'), createTestValue('Bob')];

    const stats = await getDeduplicationStats([], newValues);

    expect(stats).toEqual({
      total: 2,
      unique: 2,
      duplicate: 0,
      percentage: 0,
    });
  });

  it('should handle empty input', async () => {
    const stats = await getDeduplicationStats([], []);

    expect(stats).toEqual({
      total: 0,
      unique: 0,
      duplicate: 0,
      percentage: 0,
    });
  });
});

describe('Performance and Edge Cases', () => {
  it('should maintain order of unique values', async () => {
    const newValues = [
      { database: 'db', schema: 's', table: 't', column: 'c', value: 'Z' },
      { database: 'db', schema: 's', table: 't', column: 'c', value: 'A' },
      { database: 'db', schema: 's', table: 't', column: 'c', value: 'M' },
      { database: 'db', schema: 's', table: 't', column: 'c', value: 'B' },
    ];

    const result = await deduplicateValues({
      existingKeys: [],
      newValues,
    });

    // Values should maintain their input order
    expect(result.newValues.map((v) => v.value)).toEqual(['Z', 'A', 'M', 'B']);
  });

  it('should handle concurrent deduplication calls', async () => {
    const newValues = Array.from({ length: 100 }, (_, i) => ({
      database: 'db',
      schema: 'public',
      table: 'test',
      column: 'col',
      value: `value_${i}`,
    }));

    // Run multiple deduplication operations concurrently
    const promises = Array.from({ length: 5 }, () =>
      deduplicateValues({
        existingKeys: [],
        newValues,
      })
    );

    const results = await Promise.all(promises);

    // All should return the same result
    for (const result of results) {
      expect(result.newCount).toBe(100);
      expect(result.newValues).toHaveLength(100);
    }
  });

  it('should clean up resources on error', async () => {
    // Test that validation errors are thrown properly
    await expect(
      deduplicateValues({
        existingKeys: [],
        newValues: [{ invalid: 'object' }] as any,
      })
    ).rejects.toThrow();

    // Test that connections are cleaned up even on errors
    // by checking we can create new connections after failures
    const connection1 = await createConnection();
    await closeConnection(connection1);

    // Should be able to create another connection
    const connection2 = await createConnection();
    expect(connection2).toBeDefined();
    await closeConnection(connection2);
  });
});
