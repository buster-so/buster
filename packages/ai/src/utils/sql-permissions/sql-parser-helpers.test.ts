import { describe, it, expect } from 'vitest';
import {
  extractPhysicalTables,
  parseTableReference,
  normalizeTableIdentifier,
  tablesMatch,
  extractTablesFromYml,
  checkQueryIsReadOnly,
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
    it('should handle flat YML format with separate schema and database fields', () => {
      const yml = `
name: customer
schema: ont_ont
database: postgres
`;
      const tables = extractTablesFromYml(yml);
      expect(tables).toHaveLength(1);
      expect(tables[0]).toMatchObject({
        database: 'postgres',
        schema: 'ont_ont',
        table: 'customer',
        fullName: 'postgres.ont_ont.customer'
      });
    });

    it('should handle flat YML format with only schema', () => {
      const yml = `
name: users
schema: public
description: User data table
`;
      const tables = extractTablesFromYml(yml);
      expect(tables).toHaveLength(1);
      expect(tables[0]).toMatchObject({
        schema: 'public',
        table: 'users',
        fullName: 'public.users'
      });
    });

    it('should handle flat YML format with only database', () => {
      const yml = `
name: orders
database: analytics
version: 2
`;
      const tables = extractTablesFromYml(yml);
      expect(tables).toHaveLength(1);
      expect(tables[0]).toMatchObject({
        database: 'analytics',
        table: 'orders',
        fullName: 'analytics.orders'
      });
    });

    it('should handle models array with separate schema and database fields', () => {
      const yml = `
models:
  - name: customer
    schema: ont_ont
    database: postgres
  - name: currency
    schema: ont_ont
    database: postgres
  - name: product
    schema: catalog
    database: postgres
`;
      const tables = extractTablesFromYml(yml);
      expect(tables).toHaveLength(3);
      expect(tables[0]).toMatchObject({
        database: 'postgres',
        schema: 'ont_ont',
        table: 'customer',
        fullName: 'postgres.ont_ont.customer'
      });
      expect(tables[1]).toMatchObject({
        database: 'postgres',
        schema: 'ont_ont',
        table: 'currency',
        fullName: 'postgres.ont_ont.currency'
      });
      expect(tables[2]).toMatchObject({
        database: 'postgres',
        schema: 'catalog',
        table: 'product',
        fullName: 'postgres.catalog.product'
      });
    });

    it('should handle models array with different schema/database combinations', () => {
      const yml = `
models:
  - name: customer
    schema: ont_ont
    database: postgres
  - name: users
    schema: public
  - name: analytics_fact
    database: warehouse
`;
      const tables = extractTablesFromYml(yml);
      expect(tables).toHaveLength(3);
      expect(tables[0]).toMatchObject({
        database: 'postgres',
        schema: 'ont_ont',
        table: 'customer',
        fullName: 'postgres.ont_ont.customer'
      });
      expect(tables[1]).toMatchObject({
        schema: 'public',
        table: 'users',
        fullName: 'public.users'
      });
      expect(tables[2]).toMatchObject({
        database: 'warehouse',
        table: 'analytics_fact',
        fullName: 'warehouse.analytics_fact'
      });
    });

    it('should handle models with both schema and database fields', () => {
      const yml = `
models:
  - name: users
    schema: public
    database: primary
  - name: orders
    schema: sales
    database: analytics
`;
      const tables = extractTablesFromYml(yml);
      expect(tables).toHaveLength(2);
      expect(tables[0]).toMatchObject({ 
        database: 'primary',
        schema: 'public', 
        table: 'users',
        fullName: 'primary.public.users'
      });
      expect(tables[1]).toMatchObject({ 
        database: 'analytics',
        schema: 'sales', 
        table: 'orders',
        fullName: 'analytics.sales.orders'
      });
    });

    it('should deduplicate tables with same name/schema/database', () => {
      const yml = `
models:
  - name: users
    schema: public
    database: postgres
  - name: users
    schema: public
    database: postgres
  - name: users
    schema: public
    database: postgres
`;
      const tables = extractTablesFromYml(yml);
      expect(tables).toHaveLength(1);
      expect(tables[0]).toMatchObject({ 
        database: 'postgres',
        schema: 'public', 
        table: 'users',
        fullName: 'postgres.public.users'
      });
    });

    it('should handle models with only name field (no schema/database)', () => {
      const yml = `
models:
  - name: simple_table
    description: A simple table without schema
  - name: users
    schema: public
`;
      const tables = extractTablesFromYml(yml);
      // Should only extract the one with schema
      expect(tables).toHaveLength(1);
      expect(tables[0]).toMatchObject({
        schema: 'public',
        table: 'users',
        fullName: 'public.users'
      });
    });

    it('should handle empty or invalid YML gracefully', () => {
      const emptyYml = '';
      const tables1 = extractTablesFromYml(emptyYml);
      expect(tables1).toHaveLength(0);

      const invalidYml = 'not valid yaml: [}';
      const tables2 = extractTablesFromYml(invalidYml);
      expect(tables2).toHaveLength(0);
    });
  });

  describe('checkQueryIsReadOnly', () => {
    it('should allow SELECT statements', () => {
      const result = checkQueryIsReadOnly('SELECT * FROM users');
      expect(result.isReadOnly).toBe(true);
      expect(result.queryType).toBe('select');
      expect(result.error).toBeUndefined();
    });

    it('should allow SELECT with JOIN', () => {
      const result = checkQueryIsReadOnly('SELECT u.id, o.total FROM users u JOIN orders o ON u.id = o.user_id');
      expect(result.isReadOnly).toBe(true);
    });

    it('should allow SELECT with CTEs', () => {
      const sql = `
        WITH stats AS (
          SELECT user_id, COUNT(*) as count FROM orders GROUP BY user_id
        )
        SELECT * FROM stats
      `;
      const result = checkQueryIsReadOnly(sql);
      expect(result.isReadOnly).toBe(true);
    });

    it('should reject INSERT statements', () => {
      const result = checkQueryIsReadOnly('INSERT INTO users (name, email) VALUES ("John", "john@example.com")');
      expect(result.isReadOnly).toBe(false);
      expect(result.queryType).toBe('insert');
      expect(result.error).toContain("Query type 'insert' is not allowed");
    });

    it('should reject UPDATE statements', () => {
      const result = checkQueryIsReadOnly('UPDATE users SET name = "Jane" WHERE id = 1');
      expect(result.isReadOnly).toBe(false);
      expect(result.queryType).toBe('update');
      expect(result.error).toContain("Query type 'update' is not allowed");
    });

    it('should reject DELETE statements', () => {
      const result = checkQueryIsReadOnly('DELETE FROM users WHERE id = 1');
      expect(result.isReadOnly).toBe(false);
      expect(result.queryType).toBe('delete');
      expect(result.error).toContain("Query type 'delete' is not allowed");
    });

    it('should reject CREATE statements', () => {
      const result = checkQueryIsReadOnly('CREATE TABLE new_users (id INT, name VARCHAR(100))');
      expect(result.isReadOnly).toBe(false);
      expect(result.queryType).toBe('create');
      expect(result.error).toContain("Query type 'create' is not allowed");
    });

    it('should reject DROP statements', () => {
      const result = checkQueryIsReadOnly('DROP TABLE users');
      expect(result.isReadOnly).toBe(false);
      expect(result.queryType).toBe('drop');
      expect(result.error).toContain("Query type 'drop' is not allowed");
    });

    it('should reject ALTER statements', () => {
      const result = checkQueryIsReadOnly('ALTER TABLE users ADD COLUMN age INT');
      expect(result.isReadOnly).toBe(false);
      expect(result.queryType).toBe('alter');
      expect(result.error).toContain("Query type 'alter' is not allowed");
    });

    it('should handle PostgreSQL dialect', () => {
      const result = checkQueryIsReadOnly('SELECT * FROM postgres.public.users', 'postgres');
      expect(result.isReadOnly).toBe(true);
    });

    it('should handle invalid SQL gracefully', () => {
      const result = checkQueryIsReadOnly('NOT VALID SQL');
      expect(result.isReadOnly).toBe(false);
      expect(result.error).toContain('Failed to parse SQL');
    });
  });
});