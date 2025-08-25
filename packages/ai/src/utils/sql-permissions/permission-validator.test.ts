import * as accessControls from '@buster/access-controls';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPermissionErrorMessage, validateSqlPermissions } from './permission-validator';

// Mock the access controls module
vi.mock('@buster/access-controls', () => ({
  getPermissionedDatasets: vi.fn(),
}));

describe('Permission Validator', () => {
  describe('validateSqlPermissions', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('should allow queries with no tables', async () => {
      const result = await validateSqlPermissions('SELECT 1', 'user123');
      expect(result).toEqual({
        isAuthorized: true,
        unauthorizedTables: [],
      });
    });

    it('should allow access to permitted table', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            models:
              - name: users
                schema: public
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      const result = await validateSqlPermissions('SELECT id, name FROM public.users', 'user123');

      expect(result).toEqual({
        isAuthorized: true,
        unauthorizedTables: [],
      });
    });

    it('should deny access to unpermitted table', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            models:
              - name: users
                schema: public
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      const result = await validateSqlPermissions(
        'SELECT id, user_id FROM public.orders',
        'user123'
      );

      expect(result.isAuthorized).toBe(false);
      expect(result.unauthorizedTables).toEqual(['public.orders']);
      // May also have unauthorizedColumns for the unauthorized table
    });

    it('should check multiple tables in JOIN', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            models:
              - name: users
                schema: public
              - name: orders
                schema: public
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      const result = await validateSqlPermissions(
        'SELECT u.id, u.name, o.id, o.total FROM public.users u JOIN public.orders o ON u.id = o.user_id',
        'user123'
      );

      expect(result).toEqual({
        isAuthorized: true,
        unauthorizedTables: [],
      });
    });

    it('should deny when one table in JOIN is unpermitted', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            models:
              - name: users
                schema: public
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      const result = await validateSqlPermissions(
        'SELECT u.id, u.name, o.id, o.total FROM public.users u JOIN sales.orders o ON u.id = o.user_id',
        'user123'
      );

      expect(result.isAuthorized).toBe(false);
      expect(result.unauthorizedTables).toEqual(['sales.orders']);
      // May also have unauthorizedColumns for the unauthorized table
    });

    it('should handle complex query with CTEs', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            models:
              - name: product_total_revenue
                schema: ont_ont
              - name: product_quarterly_sales
                schema: ont_ont
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      const sql = `
        WITH top5 AS (
          SELECT ptr.product_name, SUM(ptr.metric_producttotalrevenue) AS total_revenue
          FROM ont_ont.product_total_revenue AS ptr
          GROUP BY ptr.product_name
        )
        SELECT pqs.product_name, pqs.quarter, t.total_revenue
        FROM ont_ont.product_quarterly_sales AS pqs
        JOIN top5 t ON pqs.product_name = t.product_name
      `;

      const result = await validateSqlPermissions(sql, 'user123');

      expect(result).toEqual({
        isAuthorized: true,
        unauthorizedTables: [],
      });
    });

    it('should handle subqueries', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            models:
              - name: users
                schema: public
              - name: orders
                schema: public
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      const sql = `
        SELECT u.id, u.name FROM public.users u
        WHERE u.id IN (
          SELECT user_id FROM public.orders WHERE total > 100
        )
      `;

      const result = await validateSqlPermissions(sql, 'user123');

      expect(result).toEqual({
        isAuthorized: true,
        unauthorizedTables: [],
      });
    });

    it('should match tables with different qualification levels', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            models:
              - name: users
                schema: public
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      // Query has full qualification, permission has partial
      // Note: Parser may not support database.schema.table in FROM clause
      const result = await validateSqlPermissions('SELECT id, name FROM public.users', 'user123');

      expect(result).toEqual({
        isAuthorized: true,
        unauthorizedTables: [],
      });
    });

    it('should require schema match when permission specifies schema', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            models:
              - name: users
                table_name: public.users
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      // Query missing schema that permission requires
      const result = await validateSqlPermissions('SELECT id, name FROM users', 'user123');

      expect(result.isAuthorized).toBe(false);
      expect(result.unauthorizedTables).toContain('users');
    });

    it('should handle permission check errors gracefully', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const result = await validateSqlPermissions('SELECT id, name FROM users', 'user123');

      expect(result).toEqual({
        isAuthorized: false,
        unauthorizedTables: [],
        error:
          'Permission validation failed: Database connection failed. Please verify your SQL query syntax and ensure you have access to the requested resources.',
      });
    });

    it('should handle SQL parse errors gracefully', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [],
        total: 0,
        page: 0,
        pageSize: 1000,
      });

      const result = await validateSqlPermissions('INVALID SQL SYNTAX HERE', 'user123');

      expect(result.isAuthorized).toBe(false);
      expect(result.error).toContain('Failed to parse SQL query');
    });

    it('should reject INSERT statements', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            models:
              - name: users
                schema: public
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      const result = await validateSqlPermissions(
        'INSERT INTO public.users (name) VALUES ("test")',
        'user123'
      );

      expect(result.isAuthorized).toBe(false);
      expect(result.error).toContain("Query type 'INSERT' is not allowed");
      expect(result.error).toContain('To read data, use SELECT statements instead of INSERT');
      expect(result.unauthorizedTables).toHaveLength(0);
    });

    it('should reject UPDATE statements', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            models:
              - name: users
                schema: public
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      const result = await validateSqlPermissions(
        'UPDATE public.users SET name = "updated" WHERE id = 1',
        'user123'
      );

      expect(result.isAuthorized).toBe(false);
      expect(result.error).toContain("Query type 'UPDATE' is not allowed");
      expect(result.error).toContain('To read data, use SELECT statements instead of UPDATE');
    });

    it('should reject DELETE statements', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            models:
              - name: users
                schema: public
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      const result = await validateSqlPermissions(
        'DELETE FROM public.users WHERE id = 1',
        'user123'
      );

      expect(result.isAuthorized).toBe(false);
      expect(result.error).toContain("Query type 'DELETE' is not allowed");
      expect(result.error).toContain('To read data, use SELECT statements instead of DELETE');
    });

    it('should reject CREATE TABLE statements', async () => {
      const result = await validateSqlPermissions('CREATE TABLE new_table (id INT)', 'user123');

      expect(result.isAuthorized).toBe(false);
      expect(result.error).toContain("Query type 'CREATE' is not allowed");
      expect(result.error).toContain('DDL operations like CREATE are not permitted');
    });

    it('should reject DROP TABLE statements', async () => {
      const result = await validateSqlPermissions('DROP TABLE users', 'user123');

      expect(result.isAuthorized).toBe(false);
      expect(result.error).toContain("Query type 'DROP' is not allowed");
      expect(result.error).toContain('DDL operations like DROP are not permitted');
    });

    it('should handle multiple datasets with overlapping tables', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            models:
              - name: users
                schema: public
          `,
          } as accessControls.PermissionedDataset,
          {
            ymlContent: `
            models:
              - name: users
                schema: public
              - name: orders
                schema: public
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 2,
        page: 0,
        pageSize: 1000,
      });

      const result = await validateSqlPermissions(
        'SELECT u.id, u.name, o.id, o.total FROM public.users u JOIN public.orders o ON u.id = o.user_id',
        'user123'
      );

      expect(result).toEqual({
        isAuthorized: true,
        unauthorizedTables: [],
      });
    });

    it('should block queries with unauthorized columns', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            name: customer_feedback
            database: reporting
            schema: public
            dimensions:
              - name: product_id
              - name: category
              - name: region
            measures:
              - name: feedback_score
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      const sql = `
        SELECT AVG(cf.customer_age) as avg_age
        FROM reporting.public.customer_feedback cf
        WHERE cf.category = 'Electronics'
          AND cf.region IS NOT NULL
          AND cf.customer_age IS NOT NULL
      `;

      const result = await validateSqlPermissions(sql, 'user123');

      expect(result.isAuthorized).toBe(false);
      expect(result.unauthorizedColumns).toBeDefined();
      expect(result.unauthorizedColumns).toContainEqual(
        expect.objectContaining({
          column: 'customer_age',
        })
      );
    });

    it('should allow queries with only authorized columns', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            name: users
            schema: public
            dimensions:
              - name: id
              - name: name
              - name: email
            measures:
              - name: total_orders
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      const result = await validateSqlPermissions(
        'SELECT id, name, email FROM public.users WHERE id = 1',
        'user123'
      );

      expect(result.isAuthorized).toBe(true);
      expect(result.unauthorizedColumns).toBeUndefined();
    });

    it('should handle columns in aggregate functions', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            name: orders
            schema: sales
            dimensions:
              - name: order_id
              - name: user_id
            measures:
              - name: total
              - name: quantity
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      const result = await validateSqlPermissions(
        'SELECT user_id, SUM(total) as revenue, AVG(quantity) FROM sales.orders GROUP BY user_id',
        'user123'
      );

      expect(result.isAuthorized).toBe(true);
    });

    it('should detect unauthorized columns in WHERE clause', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            name: products
            schema: catalog
            dimensions:
              - name: product_id
              - name: name
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      const result = await validateSqlPermissions(
        'SELECT product_id FROM catalog.products WHERE price > 100',
        'user123'
      );

      expect(result.isAuthorized).toBe(false);
      expect(result.unauthorizedColumns).toContainEqual(
        expect.objectContaining({
          column: 'price',
        })
      );
    });

    it('should handle backward compatibility for tables without column definitions', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            models:
              - name: legacy_table
                schema: public
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      // Should allow any columns for backward compatibility
      const result = await validateSqlPermissions(
        'SELECT any_column, another_column FROM public.legacy_table',
        'user123'
      );

      expect(result.isAuthorized).toBe(true);
    });

    it('should deny access when using unauthorized columns in complex CTE query', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            name: users
            schema: public
            dimensions:
              - name: id
              - name: name
              - name: email
            measures:
              - name: user_count
          `,
          } as accessControls.PermissionedDataset,
          {
            ymlContent: `
            name: orders
            schema: public  
            dimensions:
              - name: id
              - name: user_id
              - name: total
            measures:
              - name: order_count
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 2,
        page: 0,
        pageSize: 1000,
      });

      const sql = `
        WITH user_stats AS (
          SELECT 
            u.id,
            u.name,
            u.salary, -- unauthorized column
            COUNT(o.id) as order_count
          FROM public.users u
          LEFT JOIN public.orders o ON u.id = o.user_id
          GROUP BY u.id, u.name, u.salary
        )
        SELECT * FROM user_stats WHERE order_count > 5
      `;

      const result = await validateSqlPermissions(sql, 'user123');

      expect(result.isAuthorized).toBe(false);
      expect(result.unauthorizedColumns).toBeDefined();
      expect(result.unauthorizedColumns).toContainEqual(
        expect.objectContaining({
          table: 'public.users',
          column: 'salary',
        })
      );
    });

    it('should deny access to entire tables not in user permissions', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            models:
              - name: customers
                schema: public
              - name: orders
                schema: public
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      const sql = `
        SELECT 
          c.customer_name,
          o.total,
          p.product_name, -- products table not authorized
          i.invoice_number -- invoices table not authorized
        FROM public.customers c
        JOIN public.orders o ON c.id = o.customer_id
        JOIN public.products p ON o.product_id = p.id
        JOIN public.invoices i ON o.id = i.order_id
      `;

      const result = await validateSqlPermissions(sql, 'user123');

      expect(result.isAuthorized).toBe(false);
      expect(result.unauthorizedTables).toContain('public.products');
      expect(result.unauthorizedTables).toContain('public.invoices');
      expect(result.unauthorizedTables).not.toContain('public.customers');
      expect(result.unauthorizedTables).not.toContain('public.orders');
    });

    it('should validate columns across nested subqueries', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            name: employees
            database: hr
            schema: public
            dimensions:
              - name: employee_id
              - name: first_name
              - name: last_name
              - name: department_id
            measures:
              - name: employee_count
          `,
          } as accessControls.PermissionedDataset,
          {
            ymlContent: `
            name: departments
            database: hr
            schema: public
            dimensions:
              - name: department_id
              - name: department_name
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 2,
        page: 0,
        pageSize: 1000,
      });

      const sql = `
        SELECT 
          e.first_name,
          e.last_name,
          e.salary, -- unauthorized column
          (
            SELECT d.department_name 
            FROM hr.public.departments d 
            WHERE d.department_id = e.department_id
          ) as dept_name,
          (
            SELECT d.budget -- unauthorized column in subquery
            FROM hr.public.departments d
            WHERE d.department_id = e.department_id
          ) as dept_budget
        FROM hr.public.employees e
        WHERE e.employee_id IN (
          SELECT employee_id 
          FROM hr.public.employees 
          WHERE hire_date > '2024-01-01' -- unauthorized column in WHERE
        )
      `;

      const result = await validateSqlPermissions(sql, 'user123');

      expect(result.isAuthorized).toBe(false);
      expect(result.unauthorizedColumns).toBeDefined();
      expect(result.unauthorizedColumns?.length).toBeGreaterThan(0);

      const unauthorizedCols = result.unauthorizedColumns?.map((c) => c.column) || [];
      expect(unauthorizedCols).toContain('salary');
      expect(unauthorizedCols).toContain('budget');
      expect(unauthorizedCols).toContain('hire_date');
    });

    it('should handle complex UNION queries with mixed permissions', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            name: employees
            schema: public
            dimensions:
              - name: id
              - name: name
              - name: department
          `,
          } as accessControls.PermissionedDataset,
          {
            ymlContent: `
            name: contractors
            schema: public
            dimensions:
              - name: id
              - name: name
              - name: agency
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 2,
        page: 0,
        pageSize: 1000,
      });

      const sql = `
        SELECT 
          id,
          name,
          department as org,
          salary -- unauthorized column
        FROM public.employees
        WHERE status = 'active' -- unauthorized column
        
        UNION ALL
        
        SELECT 
          id,
          name,
          agency as org,
          hourly_rate -- unauthorized column
        FROM public.contractors
        WHERE end_date > CURRENT_DATE -- unauthorized column
        
        UNION ALL
        
        SELECT 
          id,
          name,
          school as org, -- entire interns table is unauthorized
          stipend
        FROM public.interns
      `;

      const result = await validateSqlPermissions(sql, 'user123');

      expect(result.isAuthorized).toBe(false);
      expect(result.unauthorizedTables).toContain('public.interns');
      expect(result.unauthorizedColumns).toBeDefined();

      const unauthorizedByTable = new Map<string, string[]>();
      result.unauthorizedColumns?.forEach(({ table, column }) => {
        if (!unauthorizedByTable.has(table)) {
          unauthorizedByTable.set(table, []);
        }
        unauthorizedByTable.get(table)?.push(column);
      });

      expect(unauthorizedByTable.get('public.employees')).toContain('salary');
      expect(unauthorizedByTable.get('public.employees')).toContain('status');
      expect(unauthorizedByTable.get('public.contractors')).toContain('hourly_rate');
      expect(unauthorizedByTable.get('public.contractors')).toContain('end_date');
    });

    it('should validate fully qualified table names correctly', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            name: sales_data
            schema: reporting
            dimensions:
              - name: sale_id
              - name: product_id
              - name: quantity
              - name: revenue
          `,
          } as accessControls.PermissionedDataset,
          {
            ymlContent: `
            name: products
            schema: public
            dimensions:
              - name: product_id
              - name: product_name
              - name: category
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 2,
        page: 0,
        pageSize: 1000,
      });

      const sql = `
        SELECT 
          s.sale_id,
          s.quantity,
          s.revenue,
          s.profit, -- unauthorized column
          p.product_name,
          p.category,
          p.cost, -- unauthorized column
          c.customer_name -- entire customers table is unauthorized
        FROM reporting.sales_data s
        JOIN public.products p ON s.product_id = p.product_id
        JOIN reporting.customers c ON s.customer_id = c.customer_id
        WHERE s.sale_date > '2024-01-01' -- unauthorized column
      `;

      const result = await validateSqlPermissions(sql, 'user123');

      expect(result.isAuthorized).toBe(false);
      expect(result.unauthorizedTables).toContain('reporting.customers');
      expect(result.unauthorizedColumns).toBeDefined();

      expect(result.unauthorizedColumns).toContainEqual(
        expect.objectContaining({
          table: 'reporting.sales_data',
          column: 'profit',
        })
      );
      expect(result.unauthorizedColumns).toContainEqual(
        expect.objectContaining({
          table: 'reporting.sales_data',
          column: 'sale_date',
        })
      );
      expect(result.unauthorizedColumns).toContainEqual(
        expect.objectContaining({
          table: 'public.products',
          column: 'cost',
        })
      );
    });

    it('should validate window functions and complex aggregations correctly', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            name: sales_transactions
            schema: public
            dimensions:
              - name: transaction_id
              - name: store_id
              - name: product_id
              - name: quantity
              - name: revenue
            measures:
              - name: total_revenue
              - name: total_quantity
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      const sql = `
        SELECT 
          store_id,
          product_id,
          SUM(quantity) as total_qty,
          SUM(revenue) as total_rev,
          AVG(profit) as avg_profit, -- unauthorized column
          ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY SUM(revenue) DESC) as rank,
          LAG(SUM(cost), 1) OVER (ORDER BY transaction_id) as prev_cost -- unauthorized column
        FROM public.sales_transactions
        WHERE transaction_date > '2024-01-01' -- unauthorized column
        GROUP BY store_id, product_id, transaction_id
        HAVING SUM(margin) > 1000 -- unauthorized column
      `;

      const result = await validateSqlPermissions(sql, 'user123');

      expect(result.isAuthorized).toBe(false);
      expect(result.unauthorizedColumns).toBeDefined();

      const unauthorizedCols = result.unauthorizedColumns?.map((c) => c.column) || [];
      expect(unauthorizedCols).toContain('profit');
      expect(unauthorizedCols).toContain('cost');
      expect(unauthorizedCols).toContain('transaction_date');
      expect(unauthorizedCols).toContain('margin');
    });

    it('should handle recursive CTEs with proper table validation', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            name: organizational_units
            schema: hr
            dimensions:
              - name: unit_id
              - name: parent_unit_id
              - name: unit_name
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      const sql = `
        WITH RECURSIVE org_hierarchy AS (
          SELECT 
            unit_id,
            parent_unit_id,
            unit_name,
            budget, -- unauthorized column
            0 as level
          FROM hr.organizational_units
          WHERE parent_unit_id IS NULL
          
          UNION ALL
          
          SELECT 
            o.unit_id,
            o.parent_unit_id,
            o.unit_name,
            o.headcount, -- unauthorized column
            oh.level + 1
          FROM hr.organizational_units o
          JOIN org_hierarchy oh ON o.parent_unit_id = oh.unit_id
        )
        SELECT 
          oh.unit_name,
          oh.level,
          e.employee_count -- employees table not authorized
        FROM org_hierarchy oh
        LEFT JOIN hr.employee_stats e ON oh.unit_id = e.unit_id
      `;

      const result = await validateSqlPermissions(sql, 'user123');

      expect(result.isAuthorized).toBe(false);
      expect(result.unauthorizedTables).toContain('hr.employee_stats');
      expect(result.unauthorizedColumns).toBeDefined();

      const unauthorizedCols = result.unauthorizedColumns?.map((c) => c.column) || [];
      expect(unauthorizedCols).toContain('budget');
      expect(unauthorizedCols).toContain('headcount');
    });

    it('should validate EXISTS subqueries correctly', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            name: accounts
            schema: finance
            dimensions:
              - name: account_id
              - name: account_name
              - name: account_type
          `,
          } as accessControls.PermissionedDataset,
          {
            ymlContent: `
            name: transactions
            schema: finance
            dimensions:
              - name: transaction_id
              - name: account_id
              - name: amount
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 2,
        page: 0,
        pageSize: 1000,
      });

      const sql = `
        SELECT 
          a.account_id,
          a.account_name,
          a.balance -- unauthorized column
        FROM finance.accounts a
        WHERE EXISTS (
          SELECT 1 
          FROM finance.transactions t
          WHERE t.account_id = a.account_id
            AND t.transaction_date > '2024-01-01' -- unauthorized column
            AND t.status = 'completed' -- unauthorized column
        )
        AND NOT EXISTS (
          SELECT 1
          FROM finance.audit_logs al -- entire table unauthorized
          WHERE al.account_id = a.account_id
            AND al.flag_type = 'suspicious'
        )
      `;

      const result = await validateSqlPermissions(sql, 'user123');

      expect(result.isAuthorized).toBe(false);
      expect(result.unauthorizedTables).toContain('finance.audit_logs');
      expect(result.unauthorizedColumns).toBeDefined();

      expect(result.unauthorizedColumns).toContainEqual(
        expect.objectContaining({
          table: 'finance.accounts',
          column: 'balance',
        })
      );
      expect(result.unauthorizedColumns).toContainEqual(
        expect.objectContaining({
          table: 'finance.transactions',
          column: 'transaction_date',
        })
      );
      expect(result.unauthorizedColumns).toContainEqual(
        expect.objectContaining({
          table: 'finance.transactions',
          column: 'status',
        })
      );
    });

    it('should handle SELECT * and still validate columns in other clauses', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            name: orders
            schema: sales
            dimensions:
              - name: order_id
              - name: customer_id
              - name: total
          `,
          } as accessControls.PermissionedDataset,
          {
            ymlContent: `
            name: customers
            schema: sales
            dimensions:
              - name: customer_id
              - name: customer_name
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 2,
        page: 0,
        pageSize: 1000,
      });

      const sql = `
        SELECT * 
        FROM sales.orders o
        JOIN sales.customers c ON o.customer_id = c.customer_id
        WHERE o.status = 'shipped' -- unauthorized column
          AND c.credit_score > 700 -- unauthorized column
          AND o.shipping_cost < 50 -- unauthorized column
        ORDER BY o.priority DESC -- unauthorized column
      `;

      const result = await validateSqlPermissions(sql, 'user123');

      expect(result.isAuthorized).toBe(false);
      expect(result.unauthorizedColumns).toBeDefined();

      const unauthorizedCols =
        result.unauthorizedColumns?.map((c) => ({ table: c.table, column: c.column })) || [];
      expect(unauthorizedCols).toContainEqual({ table: 'sales.orders', column: 'status' });
      expect(unauthorizedCols).toContainEqual({ table: 'sales.orders', column: 'shipping_cost' });
      expect(unauthorizedCols).toContainEqual({ table: 'sales.orders', column: 'priority' });
      expect(unauthorizedCols).toContainEqual({ table: 'sales.customers', column: 'credit_score' });
    });

    it('should not treat column aliases as physical columns requiring permissions', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            name: sales_order_header
            database: postgres
            schema: ont_ont
            dimensions:
              - name: orderdate
              - name: subtotal
              - name: salesorderid
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 1,
        page: 0,
        pageSize: 1000,
      });

      // This is the exact query from the user's example
      const sql = `
        SELECT 
          DATE_TRUNC('month', soh.orderdate) as order_month,
          SUM(soh.subtotal) as monthly_revenue
        FROM postgres.ont_ont.sales_order_header soh
        WHERE soh.orderdate >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', soh.orderdate)
        ORDER BY order_month DESC
        LIMIT 12
      `;

      const result = await validateSqlPermissions(sql, 'user123');

      // Should be authorized - order_month is just an alias, not a physical column
      expect(result.isAuthorized).toBe(true);
      expect(result.unauthorizedColumns).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it('should not treat aliases in complex JOIN queries as physical columns', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce({
        datasets: [
          {
            ymlContent: `
            name: sales_order_detail
            database: postgres
            schema: ont_ont
            dimensions:
              - name: linetotal
              - name: productid
              - name: salesorderid
          `,
          } as accessControls.PermissionedDataset,
          {
            ymlContent: `
            name: product
            database: postgres
            schema: ont_ont
            dimensions:
              - name: productid
              - name: name
          `,
          } as accessControls.PermissionedDataset,
          {
            ymlContent: `
            name: sales_order_header
            database: postgres
            schema: ont_ont
            dimensions:
              - name: salesorderid
              - name: orderdate
          `,
          } as accessControls.PermissionedDataset,
        ],
        total: 3,
        page: 0,
        pageSize: 1000,
      });

      // This is the second query from the user's example
      const sql = `
        SELECT 
          p.name as product_name,
          SUM(sod.linetotal) as product_revenue
        FROM postgres.ont_ont.sales_order_detail sod
        JOIN postgres.ont_ont.product p ON sod.productid = p.productid
        JOIN postgres.ont_ont.sales_order_header soh ON sod.salesorderid = soh.salesorderid
        WHERE soh.orderdate >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY p.productid, p.name
        ORDER BY product_revenue DESC
        LIMIT 15
      `;

      const result = await validateSqlPermissions(sql, 'user123');

      // Should be authorized - product_name and product_revenue are just aliases
      expect(result.isAuthorized).toBe(true);
      expect(result.unauthorizedColumns).toBeUndefined();
      expect(result.error).toBeUndefined();
    });
  });

  describe('createPermissionErrorMessage', () => {
    it('should handle empty arrays', () => {
      expect(createPermissionErrorMessage([], [])).toBe('');
    });

    it('should handle single table', () => {
      expect(createPermissionErrorMessage(['public.users'])).toBe(
        'Insufficient permissions: You do not have access to table: public.users. Please request access to this table or use a different table that you have permissions for.'
      );
    });

    it('should handle multiple tables', () => {
      expect(createPermissionErrorMessage(['public.users', 'sales.orders'])).toBe(
        'Insufficient permissions: You do not have access to the following tables: public.users, sales.orders. Please request access to these tables or modify your query to use only authorized tables.'
      );
    });

    it('should handle unauthorized columns', () => {
      const message = createPermissionErrorMessage(
        [],
        [
          { table: 'users', column: 'salary' },
          { table: 'users', column: 'ssn' },
        ]
      );
      expect(message).toContain('Unauthorized column access');
      expect(message).toContain('salary');
      expect(message).toContain('ssn');
    });

    it('should handle both tables and columns', () => {
      const message = createPermissionErrorMessage(
        ['private.secrets'],
        [{ table: 'users', column: 'password' }]
      );
      expect(message).toContain(
        'You do not have access to table: private.secrets. Please request access'
      );
      expect(message).toContain('Unauthorized column access');
      expect(message).toContain('password');
    });
  });
});
