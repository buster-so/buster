import { describe, expect, it } from 'vitest';
import {
  type ParsedTable,
  checkQueryIsReadOnly,
  extractColumnReferences,
  extractDatasetsFromYml,
  extractPhysicalTables,
  extractTablesFromYml,
  normalizeTableIdentifier,
  parseTableReference,
  tablesMatch,
  validateWildcardUsage,
} from './sql-parser-helpers';

describe('SQL Parser Helpers', () => {
  describe('parseTableReference', () => {
    it('should parse simple table name', () => {
      const result = parseTableReference('users');
      expect(result).toEqual({
        table: 'users',
        fullName: 'users',
      });
    });

    it('should parse schema.table format', () => {
      const result = parseTableReference('public.users');
      expect(result).toEqual({
        schema: 'public',
        table: 'users',
        fullName: 'public.users',
      });
    });

    it('should parse database.schema.table format', () => {
      const result = parseTableReference('mydb.public.users');
      expect(result).toEqual({
        database: 'mydb',
        schema: 'public',
        table: 'users',
        fullName: 'mydb.public.users',
      });
    });

    it('should handle quoted identifiers', () => {
      const result = parseTableReference('"my schema"."my table"');
      expect(result).toEqual({
        schema: 'my schema',
        table: 'my table',
        fullName: 'my schema.my table',
      });
    });

    it('should handle PostgreSQL :: separator', () => {
      const result = parseTableReference('catalog::schema.table');
      expect(result).toEqual({
        database: 'catalog',
        schema: 'schema',
        table: 'table',
        fullName: 'catalog.schema.table',
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
      expect(tables.map((t) => t.table)).toEqual(['users', 'orders']);
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
      expect(tables.map((t) => t.table)).toEqual(['orders', 'users']);
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
      expect(tables.map((t) => t.table).sort()).toEqual(['orders', 'users']);
    });

    it('should handle UNION queries', () => {
      const sql = `
        SELECT id, name FROM employees
        UNION
        SELECT id, name FROM contractors
      `;
      const tables = extractPhysicalTables(sql);
      expect(tables).toHaveLength(2);
      expect(tables.map((t) => t.table).sort()).toEqual(['contractors', 'employees']);
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
        fullName: 'MyDB.Public.Users',
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
        fullName: 'mydb.public.users',
      };
      const permission: ParsedTable = {
        schema: 'public',
        table: 'users',
        fullName: 'public.users',
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
      const permission: ParsedTable = {
        schema: 'private',
        table: 'users',
        fullName: 'private.users',
      };
      expect(tablesMatch(query, permission)).toBe(false);
    });

    it('should not match when query lacks required schema', () => {
      const query: ParsedTable = { table: 'users', fullName: 'users' };
      const permission: ParsedTable = {
        schema: 'public',
        table: 'users',
        fullName: 'public.users',
      };
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
        fullName: 'postgres.ont_ont.customer',
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
        fullName: 'public.users',
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
        fullName: 'analytics.orders',
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
        fullName: 'postgres.ont_ont.customer',
      });
      expect(tables[1]).toMatchObject({
        database: 'postgres',
        schema: 'ont_ont',
        table: 'currency',
        fullName: 'postgres.ont_ont.currency',
      });
      expect(tables[2]).toMatchObject({
        database: 'postgres',
        schema: 'catalog',
        table: 'product',
        fullName: 'postgres.catalog.product',
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
        fullName: 'postgres.ont_ont.customer',
      });
      expect(tables[1]).toMatchObject({
        schema: 'public',
        table: 'users',
        fullName: 'public.users',
      });
      expect(tables[2]).toMatchObject({
        database: 'warehouse',
        table: 'analytics_fact',
        fullName: 'warehouse.analytics_fact',
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
        fullName: 'primary.public.users',
      });
      expect(tables[1]).toMatchObject({
        database: 'analytics',
        schema: 'sales',
        table: 'orders',
        fullName: 'analytics.sales.orders',
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
        fullName: 'postgres.public.users',
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
        fullName: 'public.users',
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

  describe('validateWildcardUsage', () => {
    it('should block unqualified wildcard on physical table', () => {
      const sql = 'SELECT * FROM users';
      const result = validateWildcardUsage(sql);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('SELECT * is not allowed on physical table: users');
      expect(result.blockedTables).toContain('users');
    });

    it('should block qualified wildcard on physical table', () => {
      const sql = 'SELECT u.* FROM users u';
      const result = validateWildcardUsage(sql);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('SELECT * is not allowed on physical table: users');
      expect(result.blockedTables).toContain('users');
    });

    it('should allow wildcard on CTE', () => {
      const sql = `
        WITH user_stats AS (
          SELECT user_id, COUNT(*) as count FROM orders GROUP BY user_id
        )
        SELECT * FROM user_stats
      `;
      const result = validateWildcardUsage(sql);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should allow qualified wildcard on CTE', () => {
      const sql = `
        WITH user_stats AS (
          SELECT user_id, COUNT(*) as count FROM orders GROUP BY user_id
        )
        SELECT us.* FROM user_stats us
      `;
      const result = validateWildcardUsage(sql);
      expect(result.isValid).toBe(true);
    });

    it('should block wildcard when CTE uses wildcard on physical table', () => {
      const sql = `
        WITH user_cte AS (
          SELECT * FROM users
        )
        SELECT * FROM user_cte
      `;
      const result = validateWildcardUsage(sql);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('SELECT * is not allowed on physical table: users');
      expect(result.blockedTables).toContain('users');
    });

    it('should allow wildcard when CTE uses explicit columns', () => {
      const sql = `
        WITH user_cte AS (
          SELECT id, name FROM users
        )
        SELECT * FROM user_cte
      `;
      const result = validateWildcardUsage(sql);
      expect(result.isValid).toBe(true);
    });

    it('should block wildcard on physical tables in JOIN', () => {
      const sql = `
        WITH orders_cte AS (
          SELECT order_id FROM orders
        )
        SELECT oc.*, u.* FROM orders_cte oc JOIN users u ON oc.order_id = u.id
      `;
      const result = validateWildcardUsage(sql);
      expect(result.isValid).toBe(false);
      expect(result.blockedTables).toContain('users');
    });

    it('should allow explicit column selection', () => {
      const sql = 'SELECT id, name, email FROM users';
      const result = validateWildcardUsage(sql);
      expect(result.isValid).toBe(true);
    });

    it('should handle multiple physical tables with wildcards', () => {
      const sql = 'SELECT u.*, o.* FROM users u JOIN orders o ON u.id = o.user_id';
      const result = validateWildcardUsage(sql);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('SELECT * is not allowed on physical tables: users, orders');
      expect(result.blockedTables).toEqual(expect.arrayContaining(['users', 'orders']));
    });

    it('should handle schema-qualified tables', () => {
      const sql = 'SELECT * FROM public.users';
      const result = validateWildcardUsage(sql);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('SELECT * is not allowed on physical table: users');
    });

    it('should handle invalid SQL gracefully', () => {
      const sql = 'NOT VALID SQL';
      const result = validateWildcardUsage(sql);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Failed to validate wildcard usage in SQL query');
    });
  });

  describe('extractDatasetsFromYml', () => {
    it('should extract dataset with dimensions and measures', () => {
      const yml = `
name: customer_feedback
description: Customer feedback metrics
database: reporting
schema: public
dimensions:
  - name: product_id
    description: ID of the product
    type: string
  - name: category
    description: Product category
    type: string
  - name: region
    description: Geographic region
    type: string
measures:
  - name: feedback_score
    description: Customer feedback score
    type: number
  - name: response_count
    description: Number of responses
    type: number
`;
      const datasets = extractDatasetsFromYml(yml);
      expect(datasets).toHaveLength(1);
      const dataset = datasets[0];
      expect(dataset).toBeDefined();
      expect(dataset).toMatchObject({
        database: 'reporting',
        schema: 'public',
        table: 'customer_feedback',
        fullName: 'reporting.public.customer_feedback',
      });
      expect(dataset!.allowedColumns).toBeInstanceOf(Set);
      expect(dataset!.allowedColumns.size).toBe(5);
      expect(dataset!.allowedColumns.has('product_id')).toBe(true);
      expect(dataset!.allowedColumns.has('category')).toBe(true);
      expect(dataset!.allowedColumns.has('region')).toBe(true);
      expect(dataset!.allowedColumns.has('feedback_score')).toBe(true);
      expect(dataset!.allowedColumns.has('response_count')).toBe(true);
      // Should not have non-existent column
      expect(dataset!.allowedColumns.has('customer_age')).toBe(false);
    });

    it('should handle dataset without dimensions or measures', () => {
      const yml = `
name: simple_table
database: analytics
schema: public
`;
      const datasets = extractDatasetsFromYml(yml);
      expect(datasets).toHaveLength(1);
      const dataset = datasets[0];
      expect(dataset).toBeDefined();
      expect(dataset!.allowedColumns.size).toBe(0);
    });

    it('should handle models array format with dimensions and measures', () => {
      const yml = `
models:
  - name: users
    schema: public
    dimensions:
      - name: id
      - name: name
    measures:
      - name: total_orders
  - name: products
    schema: catalog
    dimensions:
      - name: product_id
      - name: product_name
`;
      const datasets = extractDatasetsFromYml(yml);
      expect(datasets).toHaveLength(2);
      const dataset1 = datasets[0];
      const dataset2 = datasets[1];
      expect(dataset1).toBeDefined();
      expect(dataset2).toBeDefined();
      expect(dataset1!.allowedColumns.has('id')).toBe(true);
      expect(dataset1!.allowedColumns.has('name')).toBe(true);
      expect(dataset1!.allowedColumns.has('total_orders')).toBe(true);
      expect(dataset2!.allowedColumns.has('product_id')).toBe(true);
      expect(dataset2!.allowedColumns.has('product_name')).toBe(true);
    });
  });

  describe('extractColumnReferences', () => {
    it('should extract column references from simple SELECT', () => {
      const sql = 'SELECT id, name FROM users';
      const columns = extractColumnReferences(sql);
      expect(columns.has('users')).toBe(true);
      expect(columns.get('users')).toEqual(new Set(['id', 'name']));
    });

    it('should extract columns from WHERE clause', () => {
      const sql = 'SELECT * FROM users WHERE age > 18 AND status = "active"';
      const columns = extractColumnReferences(sql);
      expect(columns.has('users')).toBe(true);
      expect(columns.get('users')).toContain('age');
      expect(columns.get('users')).toContain('status');
    });

    it('should handle table aliases', () => {
      const sql = 'SELECT u.id, u.name FROM users u WHERE u.age > 18';
      const columns = extractColumnReferences(sql);
      expect(columns.has('users')).toBe(true);
      expect(columns.get('users')).toEqual(new Set(['id', 'name', 'age']));
    });

    it('should handle JOINs with aliases', () => {
      const sql = `
        SELECT u.name, o.total 
        FROM users u 
        JOIN orders o ON u.id = o.user_id 
        WHERE o.status = "completed"
      `;
      const columns = extractColumnReferences(sql);
      expect(columns.has('users')).toBe(true);
      expect(columns.has('orders')).toBe(true);
      expect(columns.get('users')).toEqual(new Set(['name', 'id']));
      expect(columns.get('orders')).toEqual(new Set(['total', 'user_id', 'status']));
    });

    it('should handle aggregate functions', () => {
      const sql = 'SELECT AVG(age) as avg_age, COUNT(id) as total FROM users';
      const columns = extractColumnReferences(sql);
      expect(columns.has('users')).toBe(true);
      expect(columns.get('users')).toEqual(new Set(['age', 'id']));
    });

    it('should handle GROUP BY and HAVING', () => {
      const sql = `
        SELECT department, AVG(salary) as avg_salary 
        FROM employees 
        GROUP BY department 
        HAVING AVG(salary) > 50000
      `;
      const columns = extractColumnReferences(sql);
      expect(columns.has('employees')).toBe(true);
      expect(columns.get('employees')).toEqual(new Set(['department', 'salary']));
    });

    it('should exclude CTE columns from validation', () => {
      const sql = `
        WITH user_stats AS (
          SELECT user_id, COUNT(*) as order_count FROM orders GROUP BY user_id
        )
        SELECT u.name, us.order_count 
        FROM users u 
        JOIN user_stats us ON u.id = us.user_id
      `;
      const columns = extractColumnReferences(sql);
      expect(columns.has('users')).toBe(true);
      expect(columns.has('orders')).toBe(true);
      expect(columns.has('user_stats')).toBe(false); // CTE should not be tracked
      expect(columns.get('users')).toEqual(new Set(['name', 'id']));
      expect(columns.get('orders')).toEqual(new Set(['user_id']));
    });

    it('should extract columns from complex query with undocumented columns', () => {
      const sql = `
        SELECT AVG(cf.customer_age) as avg_age
        FROM public.customer_feedback cf
        WHERE cf.category = 'Electronics'
          AND cf.region IS NOT NULL
          AND cf.customer_age IS NOT NULL
      `;
      const columns = extractColumnReferences(sql);
      // Table name should be extracted as schema-qualified name
      expect(columns.has('public.customer_feedback')).toBe(true);

      const tableColumns = columns.get('public.customer_feedback');
      expect(tableColumns).toBeDefined();
      expect(tableColumns).toContain('customer_age');
      expect(tableColumns).toContain('category');
      expect(tableColumns).toContain('region');
    });

    it('should handle CASE expressions', () => {
      const sql = `
        SELECT 
          CASE 
            WHEN age < 18 THEN 'minor'
            WHEN age >= 65 THEN 'senior'
            ELSE 'adult'
          END as age_group,
          name
        FROM users
      `;
      const columns = extractColumnReferences(sql);
      expect(columns.has('users')).toBe(true);
      expect(columns.get('users')).toEqual(new Set(['age', 'name']));
    });

    it('should handle subqueries', () => {
      const sql = `
        SELECT name 
        FROM users 
        WHERE id IN (
          SELECT user_id FROM orders WHERE total > 100
        )
      `;
      const columns = extractColumnReferences(sql);
      expect(columns.has('users')).toBe(true);
      expect(columns.has('orders')).toBe(true);
      expect(columns.get('users')).toEqual(new Set(['name', 'id']));
      expect(columns.get('orders')).toEqual(new Set(['user_id', 'total']));
    });

    it('should extract columns from complex query with multiple CTEs', () => {
      const sql = `
        WITH 
        user_orders AS (
          SELECT u.id, u.name, u.email, COUNT(o.id) as order_count, SUM(o.total) as total_spent
          FROM users u
          LEFT JOIN orders o ON u.id = o.user_id
          WHERE u.status = 'active' AND o.created_at > '2024-01-01'
          GROUP BY u.id, u.name, u.email
        ),
        high_value_users AS (
          SELECT id, name, total_spent
          FROM user_orders
          WHERE total_spent > 1000
        )
        SELECT 
          hvu.name,
          hvu.total_spent,
          p.product_name,
          p.category
        FROM high_value_users hvu
        JOIN orders o ON hvu.id = o.user_id
        JOIN products p ON o.product_id = p.id
        WHERE p.is_active = true
      `;
      const columns = extractColumnReferences(sql);

      // Should extract columns from physical tables only, not CTEs
      expect(columns.has('users')).toBe(true);
      expect(columns.has('orders')).toBe(true);
      expect(columns.has('products')).toBe(true);
      expect(columns.has('user_orders')).toBe(false); // CTE should not be included
      expect(columns.has('high_value_users')).toBe(false); // CTE should not be included

      // Check extracted columns
      expect(columns.get('users')).toEqual(new Set(['id', 'name', 'email', 'status']));
      expect(columns.get('orders')).toEqual(
        new Set(['id', 'user_id', 'created_at', 'total', 'product_id'])
      );
      expect(columns.get('products')).toEqual(
        new Set(['product_name', 'category', 'id', 'is_active'])
      );
    });

    it('should handle nested subqueries with multiple table references', () => {
      const sql = `
        SELECT 
          c.customer_name,
          c.country,
          (
            SELECT COUNT(*) 
            FROM orders o 
            WHERE o.customer_id = c.id 
              AND o.status = 'completed'
              AND o.total > (
                SELECT AVG(total) 
                FROM orders 
                WHERE year = 2024
              )
          ) as high_value_orders,
          (
            SELECT SUM(p.amount) 
            FROM payments p
            JOIN invoices i ON p.invoice_id = i.id
            WHERE i.customer_id = c.id
              AND p.status = 'paid'
          ) as total_paid
        FROM customers c
        WHERE c.region IN ('US', 'EU')
          AND EXISTS (
            SELECT 1 
            FROM subscriptions s
            WHERE s.customer_id = c.id
              AND s.status = 'active'
              AND s.plan_type IN ('premium', 'enterprise')
          )
      `;
      const columns = extractColumnReferences(sql);

      expect(columns.has('customers')).toBe(true);
      expect(columns.has('orders')).toBe(true);
      expect(columns.has('payments')).toBe(true);
      expect(columns.has('invoices')).toBe(true);
      expect(columns.has('subscriptions')).toBe(true);

      expect(columns.get('customers')).toEqual(
        new Set(['customer_name', 'country', 'id', 'region'])
      );
      expect(columns.get('orders')).toEqual(new Set(['customer_id', 'status', 'total', 'year']));
      expect(columns.get('payments')).toEqual(new Set(['amount', 'invoice_id', 'status']));
      expect(columns.get('invoices')).toEqual(new Set(['id', 'customer_id']));
      expect(columns.get('subscriptions')).toEqual(new Set(['customer_id', 'status', 'plan_type']));
    });

    it('should handle UNION queries with different tables', () => {
      const sql = `
        SELECT 
          employee_id as person_id,
          first_name,
          last_name,
          department,
          'employee' as person_type
        FROM employees
        WHERE status = 'active'
        
        UNION ALL
        
        SELECT 
          contractor_id as person_id,
          first_name,
          last_name,
          agency as department,
          'contractor' as person_type
        FROM contractors
        WHERE end_date > CURRENT_DATE
        
        UNION ALL
        
        SELECT 
          intern_id as person_id,
          first_name,
          last_name,
          school as department,
          'intern' as person_type
        FROM interns
        WHERE program_year = 2024
      `;
      const columns = extractColumnReferences(sql);

      expect(columns.has('employees')).toBe(true);
      expect(columns.has('contractors')).toBe(true);
      expect(columns.has('interns')).toBe(true);

      expect(columns.get('employees')).toEqual(
        new Set(['employee_id', 'first_name', 'last_name', 'department', 'status'])
      );
      expect(columns.get('contractors')).toEqual(
        new Set(['contractor_id', 'first_name', 'last_name', 'agency', 'end_date'])
      );
      expect(columns.get('interns')).toEqual(
        new Set(['intern_id', 'first_name', 'last_name', 'school', 'program_year'])
      );
    });

    it('should handle window functions and complex aggregations', () => {
      const sql = `
        SELECT 
          s.store_id,
          s.store_name,
          s.region,
          p.product_id,
          p.product_name,
          SUM(sd.quantity) as total_quantity,
          SUM(sd.revenue) as total_revenue,
          AVG(sd.price) as avg_price,
          ROW_NUMBER() OVER (PARTITION BY s.region ORDER BY SUM(sd.revenue) DESC) as revenue_rank,
          DENSE_RANK() OVER (ORDER BY SUM(sd.quantity) DESC) as quantity_rank,
          LAG(SUM(sd.revenue), 1) OVER (PARTITION BY s.store_id ORDER BY p.product_id) as prev_product_revenue
        FROM stores s
        JOIN sales_data sd ON s.store_id = sd.store_id
        JOIN products p ON sd.product_id = p.product_id
        WHERE sd.sale_date BETWEEN '2024-01-01' AND '2024-12-31'
          AND s.is_active = true
          AND p.category IN ('electronics', 'appliances')
        GROUP BY s.store_id, s.store_name, s.region, p.product_id, p.product_name
        HAVING SUM(sd.revenue) > 10000
      `;
      const columns = extractColumnReferences(sql);

      expect(columns.has('stores')).toBe(true);
      expect(columns.has('sales_data')).toBe(true);
      expect(columns.has('products')).toBe(true);

      expect(columns.get('stores')).toEqual(
        new Set(['store_id', 'store_name', 'region', 'is_active'])
      );
      expect(columns.get('sales_data')).toEqual(
        new Set(['quantity', 'revenue', 'price', 'store_id', 'product_id', 'sale_date'])
      );
      expect(columns.get('products')).toEqual(new Set(['product_id', 'product_name', 'category']));
    });

    it('should handle complex JOIN conditions with multiple columns', () => {
      const sql = `
        SELECT 
          t1.transaction_id,
          t1.amount,
          t2.balance,
          a1.account_name as from_account,
          a2.account_name as to_account
        FROM transactions t1
        JOIN transactions t2 ON t1.transaction_id = t2.parent_transaction_id 
          AND t1.transaction_date = t2.transaction_date
          AND t1.currency = t2.currency
        JOIN accounts a1 ON t1.from_account_id = a1.account_id
          AND t1.account_type = a1.account_type
        JOIN accounts a2 ON t1.to_account_id = a2.account_id
          AND t2.account_type = a2.account_type
        WHERE t1.status = 'completed'
          AND t2.status = 'completed'
          AND a1.is_active = true
          AND a2.is_active = true
      `;
      const columns = extractColumnReferences(sql);

      expect(columns.has('transactions')).toBe(true);
      expect(columns.has('accounts')).toBe(true);

      expect(columns.get('transactions')).toEqual(
        new Set([
          'transaction_id',
          'amount',
          'balance',
          'parent_transaction_id',
          'transaction_date',
          'currency',
          'from_account_id',
          'account_type',
          'to_account_id',
          'status',
        ])
      );
      expect(columns.get('accounts')).toEqual(
        new Set(['account_name', 'account_id', 'account_type', 'is_active'])
      );
    });

    it('should handle fully qualified table names with database and schema', () => {
      // Note: node-sql-parser has limitations with three-part naming (database.schema.table)
      // Using two-part naming (schema.table) instead
      const sql = `
        SELECT 
          u.user_id,
          u.username,
          p.profile_data,
          l.last_login
        FROM public.users u
        JOIN public.user_profiles p ON u.user_id = p.user_id
        JOIN reporting.login_history l ON u.user_id = l.user_id
        WHERE u.created_at > '2024-01-01'
          AND p.is_verified = true
          AND l.login_count > 5
      `;
      const columns = extractColumnReferences(sql);

      // Should handle schema-qualified names
      expect(columns.has('public.users')).toBe(true);
      expect(columns.has('public.user_profiles')).toBe(true);
      expect(columns.has('reporting.login_history')).toBe(true);

      expect(columns.get('public.users')).toEqual(new Set(['user_id', 'username', 'created_at']));
      expect(columns.get('public.user_profiles')).toEqual(
        new Set(['profile_data', 'user_id', 'is_verified'])
      );
      expect(columns.get('reporting.login_history')).toEqual(
        new Set(['last_login', 'user_id', 'login_count'])
      );
    });

    it('should handle SELECT * but still extract columns from WHERE/JOIN clauses', () => {
      const sql = `
        SELECT * 
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.status = 'shipped'
          AND c.country = 'USA'
          AND o.total > 100
      `;
      const columns = extractColumnReferences(sql);

      expect(columns.has('orders')).toBe(true);
      expect(columns.has('customers')).toBe(true);

      // Even with SELECT *, we should extract columns from WHERE and JOIN
      expect(columns.get('orders')).toEqual(new Set(['customer_id', 'status', 'total']));
      expect(columns.get('customers')).toEqual(new Set(['id', 'country']));
    });

    it('should exclude column aliases from permission checks', () => {
      const sql = `
        SELECT 
          COUNT(*) AS total_count,
          SUM(amount) AS total_amount,
          AVG(price) AS avg_price
        FROM sales
      `;
      const columns = extractColumnReferences(sql);

      expect(columns.has('sales')).toBe(true);
      // Should only have columns from aggregate functions, not the aliases
      expect(columns.get('sales')).toEqual(new Set(['amount', 'price']));
      // Should NOT include 'total_count', 'total_amount', or 'avg_price' as they are aliases
    });

    it('should exclude aliases when referenced in ORDER BY', () => {
      const sql = `
        SELECT 
          DATE_TRUNC('month', orderdate) AS order_month,
          SUM(subtotal) AS monthly_revenue
        FROM sales_order_header
        WHERE orderdate >= '2024-01-01'
        GROUP BY DATE_TRUNC('month', orderdate)
        ORDER BY order_month DESC
      `;
      const columns = extractColumnReferences(sql);

      expect(columns.has('sales_order_header')).toBe(true);
      // Should only extract actual columns, not aliases
      expect(columns.get('sales_order_header')).toEqual(new Set(['orderdate', 'subtotal']));
      // Should NOT include 'order_month' or 'monthly_revenue' as they are aliases
    });

    it('should exclude aliases in complex queries with JOINs', () => {
      const sql = `
        SELECT 
          p.name AS product_name,
          SUM(sod.linetotal) AS product_revenue
        FROM sales_order_detail sod
        JOIN product p ON sod.productid = p.productid
        WHERE sod.orderdate >= '2024-01-01'
        GROUP BY p.productid, p.name
        ORDER BY product_revenue DESC
      `;
      const columns = extractColumnReferences(sql);

      expect(columns.has('sales_order_detail')).toBe(true);
      expect(columns.has('product')).toBe(true);

      // Should only extract physical columns
      expect(columns.get('sales_order_detail')).toEqual(
        new Set(['linetotal', 'productid', 'orderdate'])
      );
      expect(columns.get('product')).toEqual(new Set(['name', 'productid']));
      // Should NOT include 'product_name' or 'product_revenue' as they are aliases
    });

    it('should handle aliases referenced in GROUP BY and HAVING', () => {
      const sql = `
        SELECT 
          customer_id,
          COUNT(*) AS order_count,
          SUM(total) AS total_spent
        FROM orders
        GROUP BY customer_id
        HAVING COUNT(*) > 5
        ORDER BY total_spent DESC
      `;
      const columns = extractColumnReferences(sql);

      expect(columns.has('orders')).toBe(true);
      // Should only extract physical columns
      expect(columns.get('orders')).toEqual(new Set(['customer_id', 'total']));
      // Should NOT include 'order_count' or 'total_spent' as they are aliases
    });

    it('should handle aliases with table prefixes correctly', () => {
      const sql = `
        SELECT 
          u.id AS user_id,
          u.name AS user_name,
          COUNT(o.id) AS order_count
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        GROUP BY u.id, u.name
        ORDER BY order_count DESC
      `;
      const columns = extractColumnReferences(sql);

      expect(columns.has('users')).toBe(true);
      expect(columns.has('orders')).toBe(true);

      expect(columns.get('users')).toEqual(new Set(['id', 'name']));
      expect(columns.get('orders')).toEqual(new Set(['id', 'user_id']));
      // Should NOT include 'user_id', 'user_name', or 'order_count' as they are aliases
    });

    it('should handle recursive CTEs', () => {
      const sql = `
        WITH RECURSIVE category_tree AS (
          SELECT 
            category_id,
            parent_category_id,
            category_name,
            0 as level
          FROM categories
          WHERE parent_category_id IS NULL
          
          UNION ALL
          
          SELECT 
            c.category_id,
            c.parent_category_id,
            c.category_name,
            ct.level + 1
          FROM categories c
          JOIN category_tree ct ON c.parent_category_id = ct.category_id
          WHERE ct.level < 5
        )
        SELECT 
          ct.category_name,
          ct.level,
          COUNT(p.product_id) as product_count,
          SUM(p.price) as total_value
        FROM category_tree ct
        LEFT JOIN products p ON ct.category_id = p.category_id
        WHERE p.is_active = true
        GROUP BY ct.category_name, ct.level
      `;
      const columns = extractColumnReferences(sql);

      // Should only include physical tables, not the CTE
      expect(columns.has('categories')).toBe(true);
      expect(columns.has('products')).toBe(true);
      expect(columns.has('category_tree')).toBe(false); // CTE should not be included

      expect(columns.get('categories')).toEqual(
        new Set(['category_id', 'parent_category_id', 'category_name'])
      );
      expect(columns.get('products')).toEqual(
        new Set(['product_id', 'price', 'category_id', 'is_active'])
      );
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
      const result = checkQueryIsReadOnly(
        'SELECT u.id, o.total FROM users u JOIN orders o ON u.id = o.user_id'
      );
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
      const result = checkQueryIsReadOnly(
        'INSERT INTO users (name, email) VALUES ("John", "john@example.com")'
      );
      expect(result.isReadOnly).toBe(false);
      expect(result.queryType).toBe('insert');
      expect(result.error).toContain("Query type 'INSERT' is not allowed");
      expect(result.error).toContain('To read data, use SELECT statements instead of INSERT');
    });

    it('should reject UPDATE statements', () => {
      const result = checkQueryIsReadOnly('UPDATE users SET name = "Jane" WHERE id = 1');
      expect(result.isReadOnly).toBe(false);
      expect(result.queryType).toBe('update');
      expect(result.error).toContain("Query type 'UPDATE' is not allowed");
      expect(result.error).toContain('To read data, use SELECT statements instead of UPDATE');
    });

    it('should reject DELETE statements', () => {
      const result = checkQueryIsReadOnly('DELETE FROM users WHERE id = 1');
      expect(result.isReadOnly).toBe(false);
      expect(result.queryType).toBe('delete');
      expect(result.error).toContain("Query type 'DELETE' is not allowed");
      expect(result.error).toContain('To read data, use SELECT statements instead of DELETE');
    });

    it('should reject CREATE statements', () => {
      const result = checkQueryIsReadOnly('CREATE TABLE new_users (id INT, name VARCHAR(100))');
      expect(result.isReadOnly).toBe(false);
      expect(result.queryType).toBe('create');
      expect(result.error).toContain("Query type 'CREATE' is not allowed");
      expect(result.error).toContain('DDL operations like CREATE are not permitted');
    });

    it('should reject DROP statements', () => {
      const result = checkQueryIsReadOnly('DROP TABLE users');
      expect(result.isReadOnly).toBe(false);
      expect(result.queryType).toBe('drop');
      expect(result.error).toContain("Query type 'DROP' is not allowed");
      expect(result.error).toContain('DDL operations like DROP are not permitted');
    });

    it('should reject ALTER statements', () => {
      const result = checkQueryIsReadOnly('ALTER TABLE users ADD COLUMN age INT');
      expect(result.isReadOnly).toBe(false);
      expect(result.queryType).toBe('alter');
      expect(result.error).toContain("Query type 'ALTER' is not allowed");
      expect(result.error).toContain('DDL operations like ALTER are not permitted');
    });

    it('should handle PostgreSQL dialect', () => {
      const result = checkQueryIsReadOnly('SELECT * FROM postgres.public.users', 'postgres');
      expect(result.isReadOnly).toBe(true);
    });

    it('should handle invalid SQL gracefully', () => {
      const result = checkQueryIsReadOnly('NOT VALID SQL');
      expect(result.isReadOnly).toBe(false);
      expect(result.error).toContain('Failed to parse SQL query for validation');
    });
  });
});
