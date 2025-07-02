import { describe, it, expect } from 'vitest';
import {
  extractPhysicalTables,
  parseTableReference,
  normalizeTableIdentifier,
  tablesMatch,
  extractTablesFromYml,
  type ParsedTable
} from './sql-parser-helpers';

describe('SQL Parser Helpers', () => {
  describe('parseTableReference', () => {
    it('should parse simple table name', () => {
      const result = parseTableReference('users');
      expect(result).toEqual({
        table: 'users',
        fullName: 'users'
      });
    });

    it('should parse schema.table format', () => {
      const result = parseTableReference('public.users');
      expect(result).toEqual({
        schema: 'public',
        table: 'users',
        fullName: 'public.users'
      });
    });

    it('should parse database.schema.table format', () => {
      const result = parseTableReference('mydb.public.users');
      expect(result).toEqual({
        database: 'mydb',
        schema: 'public',
        table: 'users',
        fullName: 'mydb.public.users'
      });
    });

    it('should handle quoted identifiers', () => {
      const result = parseTableReference('"my schema"."my table"');
      expect(result).toEqual({
        schema: 'my schema',
        table: 'my table',
        fullName: 'my schema.my table'
      });
    });

    it('should handle PostgreSQL :: separator', () => {
      const result = parseTableReference('catalog::schema.table');
      expect(result).toEqual({
        database: 'catalog',
        schema: 'schema',
        table: 'table',
        fullName: 'catalog.schema.table'
      });
    });
  });

  describe('extractPhysicalTables', () => {
    it('should extract simple table from SELECT', () => {
      const sql = 'SELECT * FROM users';
      const tables = extractPhysicalTables(sql);
      expect(tables).toHaveLength(1);
      expect(tables[0]).toMatchObject({ table: 'users' });
    });

    it('should extract multiple tables from JOIN', () => {
      const sql = 'SELECT u.id, o.order_id FROM users u JOIN orders o ON u.id = o.user_id';
      const tables = extractPhysicalTables(sql);
      expect(tables).toHaveLength(2);
      expect(tables.map(t => t.table)).toEqual(['users', 'orders']);
    });

    it('should extract schema-qualified tables', () => {
      const sql = 'SELECT * FROM public.users u JOIN sales.orders o ON u.id = o.user_id';
      const tables = extractPhysicalTables(sql);
      expect(tables).toHaveLength(2);
      expect(tables[0]).toMatchObject({ schema: 'public', table: 'users' });
      expect(tables[1]).toMatchObject({ schema: 'sales', table: 'orders' });
    });

    it('should exclude CTEs from physical tables', () => {
      const sql = `
        WITH user_stats AS (
          SELECT user_id, COUNT(*) as count FROM orders GROUP BY user_id
        )
        SELECT u.name, us.count
        FROM users u
        JOIN user_stats us ON u.id = us.user_id
      `;
      const tables = extractPhysicalTables(sql);
      expect(tables).toHaveLength(2);
      expect(tables.map(t => t.table)).toEqual(['orders', 'users']);
      // user_stats is a CTE and should not be included
    });

    it('should handle complex query with multiple CTEs', () => {
      const sql = `
        WITH top5 AS (
          SELECT ptr.product_name, SUM(ptr.metric_producttotalrevenue) AS total_revenue
          FROM ont_ont.product_total_revenue AS ptr
          GROUP BY ptr.product_name
          ORDER BY total_revenue DESC
          LIMIT 5
        ),
        quarterly_data AS (
          SELECT * FROM ont_ont.product_quarterly_sales
        )
        SELECT q.*, t.total_revenue
        FROM quarterly_data q
        JOIN top5 t ON q.product_name = t.product_name
      `;
      const tables = extractPhysicalTables(sql);
      expect(tables).toHaveLength(2);
      expect(tables[0]).toMatchObject({ schema: 'ont_ont', table: 'product_total_revenue' });
      expect(tables[1]).toMatchObject({ schema: 'ont_ont', table: 'product_quarterly_sales' });
    });

    it('should handle subqueries', () => {
      const sql = `
        SELECT * FROM users u
        WHERE u.id IN (
          SELECT user_id FROM orders WHERE total > 100
        )
      `;
      const tables = extractPhysicalTables(sql);
      expect(tables).toHaveLength(2);
      expect(tables.map(t => t.table).sort()).toEqual(['orders', 'users']);
    });

    it('should handle UNION queries', () => {
      const sql = `
        SELECT id, name FROM employees
        UNION
        SELECT id, name FROM contractors
      `;
      const tables = extractPhysicalTables(sql);
      expect(tables).toHaveLength(2);
      expect(tables.map(t => t.table).sort()).toEqual(['contractors', 'employees']);
    });

    it('should deduplicate tables', () => {
      const sql = `
        SELECT * FROM users u1
        JOIN users u2 ON u1.manager_id = u2.id
      `;
      const tables = extractPhysicalTables(sql);
      expect(tables).toHaveLength(1);
      expect(tables[0]).toMatchObject({ table: 'users' });
    });
  });

  describe('normalizeTableIdentifier', () => {
    it('should normalize simple table name', () => {
      const table: ParsedTable = { table: 'Users', fullName: 'Users' };
      expect(normalizeTableIdentifier(table)).toBe('users');
    });

    it('should normalize schema.table', () => {
      const table: ParsedTable = { schema: 'Public', table: 'Users', fullName: 'Public.Users' };
      expect(normalizeTableIdentifier(table)).toBe('public.users');
    });

    it('should normalize database.schema.table', () => {
      const table: ParsedTable = { 
        database: 'MyDB', 
        schema: 'Public', 
        table: 'Users', 
        fullName: 'MyDB.Public.Users' 
      };
      expect(normalizeTableIdentifier(table)).toBe('mydb.public.users');
    });
  });

  describe('tablesMatch', () => {
    it('should match exact table names', () => {
      const query: ParsedTable = { table: 'users', fullName: 'users' };
      const permission: ParsedTable = { table: 'users', fullName: 'users' };
      expect(tablesMatch(query, permission)).toBe(true);
    });

    it('should match case-insensitive', () => {
      const query: ParsedTable = { table: 'Users', fullName: 'Users' };
      const permission: ParsedTable = { table: 'users', fullName: 'users' };
      expect(tablesMatch(query, permission)).toBe(true);
    });

    it('should match when query has more qualification', () => {
      const query: ParsedTable = { 
        database: 'mydb', 
        schema: 'public', 
        table: 'users', 
        fullName: 'mydb.public.users' 
      };
      const permission: ParsedTable = { 
        schema: 'public', 
        table: 'users', 
        fullName: 'public.users' 
      };
      expect(tablesMatch(query, permission)).toBe(true);
    });

    it('should not match different tables', () => {
      const query: ParsedTable = { table: 'users', fullName: 'users' };
      const permission: ParsedTable = { table: 'orders', fullName: 'orders' };
      expect(tablesMatch(query, permission)).toBe(false);
    });

    it('should not match different schemas', () => {
      const query: ParsedTable = { schema: 'public', table: 'users', fullName: 'public.users' };
      const permission: ParsedTable = { schema: 'private', table: 'users', fullName: 'private.users' };
      expect(tablesMatch(query, permission)).toBe(false);
    });

    it('should not match when query lacks required schema', () => {
      const query: ParsedTable = { table: 'users', fullName: 'users' };
      const permission: ParsedTable = { schema: 'public', table: 'users', fullName: 'public.users' };
      expect(tablesMatch(query, permission)).toBe(false);
    });
  });

  describe('extractTablesFromYml', () => {
    it('should extract table_name from YML', () => {
      const yml = `
        models:
          - name: users
            table_name: public.users
            columns:
              - name: id
      `;
      const tables = extractTablesFromYml(yml);
      expect(tables).toHaveLength(1);
      expect(tables[0]).toMatchObject({ schema: 'public', table: 'users' });
    });

    it('should extract sql_table_name from YML', () => {
      const yml = `
        version: 2
        sources:
          - name: raw
            tables:
              - name: orders
                sql_table_name: raw_data.orders
      `;
      const tables = extractTablesFromYml(yml);
      expect(tables).toHaveLength(1);
      expect(tables[0]).toMatchObject({ schema: 'raw_data', table: 'orders' });
    });

    it('should extract from: patterns', () => {
      const yml = `
        metrics:
          - name: revenue
            from: finance.transactions
            measure: sum
      `;
      const tables = extractTablesFromYml(yml);
      expect(tables).toHaveLength(1);
      expect(tables[0]).toMatchObject({ schema: 'finance', table: 'transactions' });
    });

    it('should handle quoted table names', () => {
      const yml = `
        models:
          - name: users
            table_name: "public.users"
          - name: orders
            table_name: 'sales.orders'
      `;
      const tables = extractTablesFromYml(yml);
      expect(tables).toHaveLength(2);
      expect(tables[0]).toMatchObject({ schema: 'public', table: 'users' });
      expect(tables[1]).toMatchObject({ schema: 'sales', table: 'orders' });
    });

    it('should deduplicate tables', () => {
      const yml = `
        models:
          - table_name: public.users
          - table_name: public.users
        sources:
          - sql_table_name: public.users
      `;
      const tables = extractTablesFromYml(yml);
      expect(tables).toHaveLength(1);
      expect(tables[0]).toMatchObject({ schema: 'public', table: 'users' });
    });

    it('should handle database.schema.table format', () => {
      const yml = `
        models:
          - table_name: mydb.public.users
      `;
      const tables = extractTablesFromYml(yml);
      expect(tables).toHaveLength(1);
      expect(tables[0]).toMatchObject({ 
        database: 'mydb',
        schema: 'public', 
        table: 'users' 
      });
    });
  });
});