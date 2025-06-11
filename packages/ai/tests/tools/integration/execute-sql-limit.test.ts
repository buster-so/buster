import { describe, expect, test } from 'vitest';
import { ensureSqlLimit } from '../../../src/tools/database-tools/sql-limit-helper';

describe('Execute SQL Limit Integration', () => {
  test('verify limit is added to queries without limit', () => {
    const testQueries = [
      {
        input: 'SELECT id, name FROM schema.users',
        expected: 'SELECT id, name FROM schema.users LIMIT 25',
      },
      {
        input: 'SELECT COUNT(*) FROM schema.orders WHERE status = "pending"',
        expected: 'SELECT COUNT(*) FROM schema.orders WHERE status = "pending" LIMIT 25',
      },
      {
        input: `
          SELECT u.id, u.email, COUNT(o.id) as order_count
          FROM schema.users u
          LEFT JOIN schema.orders o ON u.id = o.user_id
          GROUP BY u.id, u.email
          ORDER BY order_count DESC
        `,
        expected: `SELECT u.id, u.email, COUNT(o.id) as order_count
          FROM schema.users u
          LEFT JOIN schema.orders o ON u.id = o.user_id
          GROUP BY u.id, u.email
          ORDER BY order_count DESC LIMIT 25`,
      },
    ];

    testQueries.forEach(({ input, expected }) => {
      const result = ensureSqlLimit(input);
      expect(result.trim()).toBe(expected.trim());
    });
  });

  test('verify existing limits are preserved', () => {
    const testQueries = [
      {
        input: 'SELECT id, name FROM schema.users LIMIT 10',
        expected: 'SELECT id, name FROM schema.users LIMIT 10',
      },
      {
        input: 'SELECT * FROM schema.products LIMIT 100 OFFSET 50',
        expected: 'SELECT * FROM schema.products LIMIT 100 OFFSET 50',
      },
      {
        input: 'SELECT * FROM schema.categories LIMIT 5;',
        expected: 'SELECT * FROM schema.categories LIMIT 5;',
      },
    ];

    testQueries.forEach(({ input, expected }) => {
      const result = ensureSqlLimit(input);
      expect(result).toBe(expected);
    });
  });

  test('verify non-SELECT statements are not modified', () => {
    const testQueries = [
      'INSERT INTO schema.users (name, email) VALUES ("test", "test@example.com")',
      'UPDATE schema.users SET status = "active" WHERE id = 1',
      'DELETE FROM schema.users WHERE status = "inactive"',
      'CREATE TABLE schema.temp_table (id INT, name VARCHAR(255))',
    ];

    testQueries.forEach((query) => {
      const result = ensureSqlLimit(query);
      expect(result).toBe(query);
    });
  });
});
