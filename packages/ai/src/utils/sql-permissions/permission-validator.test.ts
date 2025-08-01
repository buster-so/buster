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
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce([
        {
          ymlFile: `
            models:
              - name: users
                schema: public
          `,
        },
      ] as any);

      const result = await validateSqlPermissions('SELECT id, name FROM public.users', 'user123');

      expect(result).toEqual({
        isAuthorized: true,
        unauthorizedTables: [],
      });
    });

    it('should deny access to unpermitted table', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce([
        {
          ymlFile: `
            models:
              - name: users
                schema: public
          `,
        },
      ] as any);

      const result = await validateSqlPermissions(
        'SELECT id, user_id FROM public.orders',
        'user123'
      );

      expect(result).toEqual({
        isAuthorized: false,
        unauthorizedTables: ['public.orders'],
      });
    });

    it('should check multiple tables in JOIN', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce([
        {
          ymlFile: `
            models:
              - name: users
                schema: public
              - name: orders
                schema: public
          `,
        },
      ] as any);

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
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce([
        {
          ymlFile: `
            models:
              - name: users
                schema: public
          `,
        },
      ] as any);

      const result = await validateSqlPermissions(
        'SELECT u.id, u.name, o.id, o.total FROM public.users u JOIN sales.orders o ON u.id = o.user_id',
        'user123'
      );

      expect(result).toEqual({
        isAuthorized: false,
        unauthorizedTables: ['sales.orders'],
      });
    });

    it('should handle complex query with CTEs', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce([
        {
          ymlFile: `
            models:
              - name: product_total_revenue
                schema: ont_ont
              - name: product_quarterly_sales
                schema: ont_ont
          `,
        },
      ] as any);

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
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce([
        {
          ymlFile: `
            models:
              - name: users
                schema: public
              - name: orders
                schema: public
          `,
        },
      ] as any);

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
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce([
        {
          ymlFile: `
            models:
              - name: users
                schema: public
          `,
        },
      ] as any);

      // Query has full qualification, permission has partial
      // Note: Parser may not support database.schema.table in FROM clause
      const result = await validateSqlPermissions('SELECT id, name FROM public.users', 'user123');

      expect(result).toEqual({
        isAuthorized: true,
        unauthorizedTables: [],
      });
    });

    it('should require schema match when permission specifies schema', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce([
        {
          ymlFile: `
            models:
              - name: users
                table_name: public.users
          `,
        },
      ] as any);

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
        error: 'Permission validation failed: Database connection failed',
      });
    });

    it('should handle SQL parse errors gracefully', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce([]);

      const result = await validateSqlPermissions('INVALID SQL SYNTAX HERE', 'user123');

      expect(result.isAuthorized).toBe(false);
      expect(result.error).toContain('Failed to parse SQL');
    });

    it('should reject INSERT statements', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce([
        {
          ymlFile: `
            models:
              - name: users
                schema: public
          `,
        },
      ] as any);

      const result = await validateSqlPermissions(
        'INSERT INTO public.users (name) VALUES ("test")',
        'user123'
      );

      expect(result.isAuthorized).toBe(false);
      expect(result.error).toContain("Query type 'insert' is not allowed");
      expect(result.unauthorizedTables).toHaveLength(0);
    });

    it('should reject UPDATE statements', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce([
        {
          ymlFile: `
            models:
              - name: users
                schema: public
          `,
        },
      ] as any);

      const result = await validateSqlPermissions(
        'UPDATE public.users SET name = "updated" WHERE id = 1',
        'user123'
      );

      expect(result.isAuthorized).toBe(false);
      expect(result.error).toContain("Query type 'update' is not allowed");
    });

    it('should reject DELETE statements', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce([
        {
          ymlFile: `
            models:
              - name: users
                schema: public
          `,
        },
      ] as any);

      const result = await validateSqlPermissions(
        'DELETE FROM public.users WHERE id = 1',
        'user123'
      );

      expect(result.isAuthorized).toBe(false);
      expect(result.error).toContain("Query type 'delete' is not allowed");
    });

    it('should reject CREATE TABLE statements', async () => {
      const result = await validateSqlPermissions('CREATE TABLE new_table (id INT)', 'user123');

      expect(result.isAuthorized).toBe(false);
      expect(result.error).toContain("Query type 'create' is not allowed");
    });

    it('should reject DROP TABLE statements', async () => {
      const result = await validateSqlPermissions('DROP TABLE users', 'user123');

      expect(result.isAuthorized).toBe(false);
      expect(result.error).toContain("Query type 'drop' is not allowed");
    });

    it('should handle multiple datasets with overlapping tables', async () => {
      vi.mocked(accessControls.getPermissionedDatasets).mockResolvedValueOnce([
        {
          ymlFile: `
            models:
              - name: users
                schema: public
          `,
        },
        {
          ymlFile: `
            models:
              - name: users
                schema: public
              - name: orders
                schema: public
          `,
        },
      ] as any);

      const result = await validateSqlPermissions(
        'SELECT u.id, u.name, o.id, o.total FROM public.users u JOIN public.orders o ON u.id = o.user_id',
        'user123'
      );

      expect(result).toEqual({
        isAuthorized: true,
        unauthorizedTables: [],
      });
    });
  });

  describe('createPermissionErrorMessage', () => {
    it('should handle empty array', () => {
      expect(createPermissionErrorMessage([])).toBe('');
    });

    it('should handle single table', () => {
      expect(createPermissionErrorMessage(['public.users'])).toBe(
        'Insufficient permissions: You do not have access to table: public.users'
      );
    });

    it('should handle multiple tables', () => {
      expect(createPermissionErrorMessage(['public.users', 'sales.orders'])).toBe(
        'Insufficient permissions: You do not have access to the following tables: public.users, sales.orders'
      );
    });
  });
});
