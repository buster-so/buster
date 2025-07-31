import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataSourceConfig } from '../data-source';
import { DataSource } from '../data-source';
import type { Column, Table } from '../types/introspection';
import { SchemaIntrospectionService, createIntrospectionService } from './introspection-service';

// Mock the DataSource class
vi.mock('../data-source', () => {
  return {
    DataSource: vi.fn().mockImplementation(() => {
      return {
        getTables: vi.fn(),
        getColumns: vi.fn(),
        close: vi.fn(),
      };
    }),
  };
});

describe('SchemaIntrospectionService', () => {
  let service: SchemaIntrospectionService;
  let mockDataSource: any;
  const mockConfig: DataSourceConfig = {
    name: 'test-datasource',
    type: 'postgres',
    credentials: {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'testdb',
      username: 'user',
      password: 'pass',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SchemaIntrospectionService(mockConfig);
    mockDataSource = (DataSource as any).mock.results[0].value;
  });

  describe('introspectDatabaseSchema', () => {
    it('should introspect tables and columns successfully', async () => {
      const mockTables: Table[] = [
        { name: 'users', type: 'TABLE' },
        { name: 'orders', type: 'TABLE' },
      ];

      const mockUsersColumns: Column[] = [
        { name: 'id', dataType: 'INTEGER', nullable: false },
        { name: 'email', dataType: 'VARCHAR(255)', nullable: false },
        { name: 'created_at', dataType: 'TIMESTAMP', nullable: false },
      ];

      const mockOrdersColumns: Column[] = [
        { name: 'id', dataType: 'INTEGER', nullable: false },
        { name: 'user_id', dataType: 'INTEGER', nullable: false },
        { name: 'total', dataType: 'DECIMAL(10,2)', nullable: false },
      ];

      mockDataSource.getTables.mockResolvedValue(mockTables);
      mockDataSource.getColumns
        .mockResolvedValueOnce(mockUsersColumns)
        .mockResolvedValueOnce(mockOrdersColumns);

      const result = await service.introspectDatabaseSchema('mydb', 'public');

      expect(result.database).toBe('mydb');
      expect(result.schema).toBe('public');
      expect(result.tables).toHaveLength(2);
      expect(result.tables[0].name).toBe('users');
      expect(result.tables[0].columns).toEqual(mockUsersColumns);
      expect(result.tables[1].name).toBe('orders');
      expect(result.tables[1].columns).toEqual(mockOrdersColumns);
      expect(result.introspectedAt).toBeInstanceOf(Date);
      expect(result.error).toBeUndefined();

      // Verify correct calls
      expect(mockDataSource.getTables).toHaveBeenCalledWith('test-datasource', 'mydb', 'public');
      expect(mockDataSource.getColumns).toHaveBeenCalledTimes(2);
      expect(mockDataSource.getColumns).toHaveBeenNthCalledWith(
        1,
        'test-datasource',
        'mydb',
        'public',
        'users'
      );
      expect(mockDataSource.getColumns).toHaveBeenNthCalledWith(
        2,
        'test-datasource',
        'mydb',
        'public',
        'orders'
      );
    });

    it('should handle introspection errors gracefully', async () => {
      const error = new Error('Connection failed');
      mockDataSource.getTables.mockRejectedValue(error);

      const result = await service.introspectDatabaseSchema('mydb', 'public');

      expect(result.database).toBe('mydb');
      expect(result.schema).toBe('public');
      expect(result.tables).toEqual([]);
      expect(result.introspectedAt).toBeInstanceOf(Date);
      expect(result.error).toBe('Connection failed');
    });

    it('should handle empty schema', async () => {
      mockDataSource.getTables.mockResolvedValue([]);

      const result = await service.introspectDatabaseSchema('mydb', 'public');

      expect(result.database).toBe('mydb');
      expect(result.schema).toBe('public');
      expect(result.tables).toEqual([]);
      expect(result.introspectedAt).toBeInstanceOf(Date);
      expect(result.error).toBeUndefined();
    });
  });

  describe('introspectMultiple', () => {
    it('should introspect multiple database/schema combinations', async () => {
      const combinations = [
        { database: 'db1', schema: 'schema1' },
        { database: 'db2', schema: 'schema2' },
      ];

      const mockTables: Table[] = [{ name: 'test_table', type: 'TABLE' }];
      const mockColumns: Column[] = [{ name: 'id', dataType: 'INTEGER', nullable: false }];

      mockDataSource.getTables.mockResolvedValue(mockTables);
      mockDataSource.getColumns.mockResolvedValue(mockColumns);

      const results = await service.introspectMultiple(combinations);

      expect(results).toHaveLength(2);
      expect(results[0].database).toBe('db1');
      expect(results[0].schema).toBe('schema1');
      expect(results[1].database).toBe('db2');
      expect(results[1].schema).toBe('schema2');

      // Verify sequential processing
      expect(mockDataSource.getTables).toHaveBeenCalledTimes(2);
      expect(mockDataSource.getColumns).toHaveBeenCalledTimes(2);
    });

    it('should continue processing even if one combination fails', async () => {
      const combinations = [
        { database: 'db1', schema: 'schema1' },
        { database: 'db2', schema: 'schema2' },
      ];

      mockDataSource.getTables
        .mockRejectedValueOnce(new Error('Connection error'))
        .mockResolvedValueOnce([{ name: 'table2', type: 'TABLE' }]);

      mockDataSource.getColumns.mockResolvedValue([
        { name: 'id', dataType: 'INTEGER', nullable: false },
      ]);

      const results = await service.introspectMultiple(combinations);

      expect(results).toHaveLength(2);
      expect(results[0].error).toBe('Connection error');
      expect(results[0].tables).toEqual([]);
      expect(results[1].error).toBeUndefined();
      expect(results[1].tables).toHaveLength(1);
    });
  });

  describe('close', () => {
    it('should close data source connections', async () => {
      await service.close();
      expect(mockDataSource.close).toHaveBeenCalledOnce();
    });
  });

  describe('createIntrospectionService', () => {
    it('should create a new service instance', () => {
      const service = createIntrospectionService(mockConfig);
      expect(service).toBeInstanceOf(SchemaIntrospectionService);
    });
  });
});
