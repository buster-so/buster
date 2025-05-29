import { describe, expect, it, vi } from 'vitest';
import { PostgreSQLIntrospector } from '@/introspection/postgresql';
import { MySQLIntrospector } from '@/introspection/mysql';
import { BigQueryIntrospector } from '@/introspection/bigquery';
import { SQLServerIntrospector } from '@/introspection/sqlserver';
import { RedshiftIntrospector } from '@/introspection/redshift';
import { DatabricksIntrospector } from '@/introspection/databricks';
import type { DatabaseAdapter } from '@/adapters/base';

describe('Introspector Empty Filter Validation', () => {
  const mockAdapter: DatabaseAdapter = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    query: vi.fn(),
    isConnected: vi.fn().mockReturnValue(true),
  };

  const introspectors = [
    { name: 'PostgreSQL', introspector: new PostgreSQLIntrospector('test', mockAdapter) },
    { name: 'MySQL', introspector: new MySQLIntrospector('test', mockAdapter) },
    { name: 'BigQuery', introspector: new BigQueryIntrospector('test', mockAdapter) },
    { name: 'SQL Server', introspector: new SQLServerIntrospector('test', mockAdapter) },
    { name: 'Redshift', introspector: new RedshiftIntrospector('test', mockAdapter) },
    { name: 'Databricks', introspector: new DatabricksIntrospector('test', mockAdapter) },
  ];

  introspectors.forEach(({ name, introspector }) => {
    describe(name, () => {
      it('should throw error when databases filter is empty array', async () => {
        await expect(
          introspector.getFullIntrospection({ databases: [] })
        ).rejects.toThrow('Database filter array is empty');
      });

      it('should throw error when schemas filter is empty array', async () => {
        await expect(
          introspector.getFullIntrospection({ schemas: [] })
        ).rejects.toThrow('Schema filter array is empty');
      });

      it('should throw error when tables filter is empty array', async () => {
        await expect(
          introspector.getFullIntrospection({ tables: [] })
        ).rejects.toThrow('Table filter array is empty');
      });
    });
  });
});