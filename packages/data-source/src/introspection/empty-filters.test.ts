import { describe, expect, it, vi } from 'vitest';
import type { DatabaseAdapter } from '../adapters/base';
import { BigQueryIntrospector } from './bigquery';
import { MySQLIntrospector } from './mysql';
import { PostgreSQLIntrospector } from './postgresql';
import { RedshiftIntrospector } from './redshift';
import { SQLServerIntrospector } from './sqlserver';

describe('Introspector Empty Filter Validation', () => {
  const mockAdapter: DatabaseAdapter = {
    initialize: vi.fn(),
    query: vi.fn(),
    testConnection: vi.fn().mockResolvedValue(true),
    close: vi.fn(),
    getDataSourceType: vi.fn().mockReturnValue('test'),
    introspect: vi.fn(),
  };

  const introspectors = [
    { name: 'PostgreSQL', introspector: new PostgreSQLIntrospector('test', mockAdapter) },
    { name: 'MySQL', introspector: new MySQLIntrospector('test', mockAdapter) },
    { name: 'BigQuery', introspector: new BigQueryIntrospector('test', mockAdapter) },
    { name: 'SQL Server', introspector: new SQLServerIntrospector('test', mockAdapter) },
    { name: 'Redshift', introspector: new RedshiftIntrospector('test', mockAdapter) },
  ];

  for (const { name, introspector } of introspectors) {
    describe(name, () => {
      it('should throw error when databases filter is empty array', async () => {
        await expect(introspector.getFullIntrospection({ databases: [] })).rejects.toThrow(
          'Database filter array is empty'
        );
      });

      it('should throw error when schemas filter is empty array', async () => {
        await expect(introspector.getFullIntrospection({ schemas: [] })).rejects.toThrow(
          'Schema filter array is empty'
        );
      });

      it('should throw error when tables filter is empty array', async () => {
        await expect(introspector.getFullIntrospection({ tables: [] })).rejects.toThrow(
          'Table filter array is empty'
        );
      });
    });
  }
});
