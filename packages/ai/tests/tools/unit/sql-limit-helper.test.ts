import { describe, expect, test } from 'vitest';
import {
  ensureSqlLimit,
  ensureSqlLimitsForMultiple,
} from '../../../src/tools/database-tools/sql-limit-helper';

describe('SQL Limit Helper', () => {
  describe('ensureSqlLimit', () => {
    test('should add LIMIT 25 to SELECT statements without LIMIT', () => {
      const sql = 'SELECT * FROM users';
      const result = ensureSqlLimit(sql);
      expect(result).toBe('SELECT * FROM users LIMIT 25');
    });

    test('should not modify statements that already have LIMIT', () => {
      const sql = 'SELECT * FROM users LIMIT 10';
      const result = ensureSqlLimit(sql);
      expect(result).toBe('SELECT * FROM users LIMIT 10');
    });

    test('should handle statements with semicolons', () => {
      const sql = 'SELECT * FROM users;';
      const result = ensureSqlLimit(sql);
      expect(result).toBe('SELECT * FROM users LIMIT 25;');
    });

    test('should preserve existing LIMIT with semicolon', () => {
      const sql = 'SELECT * FROM users LIMIT 50;';
      const result = ensureSqlLimit(sql);
      expect(result).toBe('SELECT * FROM users LIMIT 50;');
    });

    test('should handle SQL with JOIN statements', () => {
      const sql = `
        SELECT u.id, u.name, o.order_id
        FROM users u
        JOIN orders o ON u.id = o.user_id
      `;
      const result = ensureSqlLimit(sql);
      expect(result.trim()).toBe(`SELECT u.id, u.name, o.order_id
        FROM users u
        JOIN orders o ON u.id = o.user_id LIMIT 25`);
    });

    test('should handle SQL with GROUP BY', () => {
      const sql = `
        SELECT department, COUNT(*) as count
        FROM employees
        GROUP BY department
      `;
      const result = ensureSqlLimit(sql);
      expect(result.trim()).toBe(`SELECT department, COUNT(*) as count
        FROM employees
        GROUP BY department LIMIT 25`);
    });

    test('should handle SQL with GROUP BY and HAVING', () => {
      const sql = `
        SELECT department, COUNT(*) as count
        FROM employees
        GROUP BY department
        HAVING COUNT(*) > 10
      `;
      const result = ensureSqlLimit(sql);
      expect(result.trim()).toBe(`SELECT department, COUNT(*) as count
        FROM employees
        GROUP BY department
        HAVING COUNT(*) > 10 LIMIT 25`);
    });

    test('should handle SQL with ORDER BY', () => {
      const sql = 'SELECT * FROM users ORDER BY created_at DESC';
      const result = ensureSqlLimit(sql);
      expect(result).toBe('SELECT * FROM users ORDER BY created_at DESC LIMIT 25');
    });

    test('should handle complex query with multiple clauses', () => {
      const sql = `
        SELECT u.id, u.name, COUNT(o.id) as order_count
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.active = true
        GROUP BY u.id, u.name
        HAVING COUNT(o.id) > 5
        ORDER BY order_count DESC
      `;
      const result = ensureSqlLimit(sql);
      expect(result.trim()).toBe(`SELECT u.id, u.name, COUNT(o.id) as order_count
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.active = true
        GROUP BY u.id, u.name
        HAVING COUNT(o.id) > 5
        ORDER BY order_count DESC LIMIT 25`);
    });

    test('should use custom limit when provided', () => {
      const sql = 'SELECT * FROM users';
      const result = ensureSqlLimit(sql, 100);
      expect(result).toBe('SELECT * FROM users LIMIT 100');
    });

    test('should handle whitespace variations', () => {
      const sql = '  SELECT * FROM users  ';
      const result = ensureSqlLimit(sql);
      expect(result).toBe('SELECT * FROM users LIMIT 25');
    });

    test('should handle case variations of LIMIT', () => {
      const testCases = [
        'SELECT * FROM users limit 10',
        'SELECT * FROM users Limit 10',
        'SELECT * FROM users LIMIT 10',
      ];

      for (const sql of testCases) {
        const result = ensureSqlLimit(sql);
        expect(result).toBe(sql);
      }
    });

    test('should not modify non-SELECT statements', () => {
      const nonSelectQueries = [
        'INSERT INTO users (name) VALUES ("John")',
        'UPDATE users SET name = "John" WHERE id = 1',
        'DELETE FROM users WHERE id = 1',
        'CREATE TABLE users (id INT)',
        'DROP TABLE users',
      ];

      for (const sql of nonSelectQueries) {
        const result = ensureSqlLimit(sql);
        expect(result).toBe(sql);
      }
    });

    test('should handle empty or invalid input', () => {
      expect(ensureSqlLimit('')).toBe('');
      expect(ensureSqlLimit(null as any)).toBe(null);
      expect(ensureSqlLimit(undefined as any)).toBe(undefined);
      expect(ensureSqlLimit(123 as any)).toBe(123);
    });

    test('should handle SQL with schema and table qualifiers', () => {
      const sql = 'SELECT analytics.users.id, analytics.users.name FROM analytics.users';
      const result = ensureSqlLimit(sql);
      expect(result).toBe(
        'SELECT analytics.users.id, analytics.users.name FROM analytics.users LIMIT 25'
      );
    });

    test('should handle SQL with LIMIT in different positions', () => {
      // LIMIT with OFFSET
      const sql1 = 'SELECT * FROM users LIMIT 10 OFFSET 20';
      expect(ensureSqlLimit(sql1)).toBe(sql1);

      // LIMIT with comma syntax (MySQL)
      const sql2 = 'SELECT * FROM users LIMIT 20, 10';
      expect(ensureSqlLimit(sql2)).toBe(sql2);
    });

    test('should handle SQL with comments', () => {
      const sql = `
        -- Get all active users
        SELECT * FROM users
        WHERE active = true
      `;
      const result = ensureSqlLimit(sql);
      expect(result.includes('LIMIT 25')).toBe(true);
    });

    test('should handle CTEs (WITH clause)', () => {
      const sql = `
        WITH active_users AS (
          SELECT * FROM users WHERE active = true
        )
        SELECT * FROM active_users
      `;
      const result = ensureSqlLimit(sql);
      expect(result.includes('LIMIT 25')).toBe(true);
      expect(result.endsWith('LIMIT 25')).toBe(true);
    });

    test('should handle subqueries', () => {
      const sql = `
        SELECT * FROM (
          SELECT * FROM users LIMIT 100
        ) AS subquery
        WHERE age > 18
      `;
      const result = ensureSqlLimit(sql);
      // Should add LIMIT to outer query, not modify inner LIMIT
      expect(result.includes('LIMIT 100')).toBe(true);
      expect(result.endsWith('LIMIT 25')).toBe(true);
    });

    test('should handle UNION queries', () => {
      const sql = `
        SELECT id, name FROM users
        UNION
        SELECT id, name FROM customers
      `;
      const result = ensureSqlLimit(sql);
      expect(result.endsWith('LIMIT 25')).toBe(true);
    });
  });

  describe('ensureSqlLimitsForMultiple', () => {
    test('should process multiple statements', () => {
      const statements = [
        'SELECT * FROM users',
        'SELECT * FROM orders LIMIT 10',
        'SELECT * FROM products;',
      ];

      const results = ensureSqlLimitsForMultiple(statements);

      expect(results).toEqual([
        'SELECT * FROM users LIMIT 25',
        'SELECT * FROM orders LIMIT 10',
        'SELECT * FROM products LIMIT 25;',
      ]);
    });

    test('should handle empty array', () => {
      const results = ensureSqlLimitsForMultiple([]);
      expect(results).toEqual([]);
    });

    test('should use custom limit for all statements', () => {
      const statements = ['SELECT * FROM users', 'SELECT * FROM orders'];
      const results = ensureSqlLimitsForMultiple(statements, 50);

      expect(results).toEqual(['SELECT * FROM users LIMIT 50', 'SELECT * FROM orders LIMIT 50']);
    });
  });
});
