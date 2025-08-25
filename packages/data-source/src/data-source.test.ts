import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseAdapter } from './adapters/base';
import { DataSource, QueryRouter } from './data-source';
import type { DataSourceConfig } from './data-source';
import type { DataSourceIntrospector } from './introspection/base';
import { DataSourceType } from './types/credentials';

// Mock the adapter factory
vi.mock('./adapters/factory', () => ({
  createAdapter: vi.fn(),
}));

describe('DataSource Unit Tests', () => {
  let dataSource: DataSource;
  let mockAdapter: DatabaseAdapter;
  let mockIntrospector: DataSourceIntrospector;

  beforeEach(async () => {
    // Create mock adapter
    mockAdapter = {
      query: vi.fn(),
      testConnection: vi.fn(),
      introspect: vi.fn(),
      close: vi.fn(),
      initialize: vi.fn(),
    } as unknown as DatabaseAdapter;

    // Create mock introspector
    mockIntrospector = {
      getDatabases: vi.fn().mockResolvedValue([]),
      getSchemas: vi.fn().mockResolvedValue([]),
      getTables: vi.fn().mockResolvedValue([]),
      getColumns: vi.fn().mockResolvedValue([]),
      getViews: vi.fn().mockResolvedValue([]),
      getTableStatistics: vi.fn().mockResolvedValue({}),
      getColumnStatistics: vi.fn().mockResolvedValue([]),
      getIndexes: vi.fn().mockResolvedValue([]),
      getForeignKeys: vi.fn().mockResolvedValue([]),
      getFullIntrospection: vi.fn().mockResolvedValue({}),
      getDataSourceType: vi.fn().mockReturnValue('postgresql'),
    };

    // Setup mock adapter to return mock introspector
    (mockAdapter.introspect as any).mockReturnValue(mockIntrospector);
    (mockAdapter.testConnection as any).mockResolvedValue(true);
    (mockAdapter.query as any).mockResolvedValue({
      rows: [{ test: 'value' }],
      fields: [{ name: 'test', type: 'string' }],
      rowCount: 1,
    });

    // Mock the createAdapter function
    const { createAdapter } = await import('./adapters/factory');
    (createAdapter as any).mockResolvedValue(mockAdapter);
  });

  afterEach(async () => {
    if (dataSource) {
      await dataSource.close();
    }
    vi.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with empty data sources', () => {
      dataSource = new DataSource({ dataSources: [] });
      expect(dataSource.getDataSources()).toEqual([]);
    });

    it('should initialize with single data source', () => {
      const config: DataSourceConfig = {
        name: 'test-postgres',
        type: DataSourceType.PostgreSQL,
        credentials: {
          type: DataSourceType.PostgreSQL,
          host: 'localhost',
          database: 'test',
          username: 'user',
          password: 'pass',
        },
      };

      dataSource = new DataSource({ dataSources: [config] });
      expect(dataSource.getDataSources()).toEqual(['test-postgres']);
    });

    it('should initialize with multiple data sources', () => {
      const configs: DataSourceConfig[] = [
        {
          name: 'postgres',
          type: DataSourceType.PostgreSQL,
          credentials: {
            type: DataSourceType.PostgreSQL,
            host: 'localhost',
            database: 'test',
            username: 'user',
            password: 'pass',
          },
        },
        {
          name: 'mysql',
          type: DataSourceType.MySQL,
          credentials: {
            type: DataSourceType.MySQL,
            host: 'localhost',
            default_database: 'test',
            username: 'user',
            password: 'pass',
          },
        },
      ];

      dataSource = new DataSource({ dataSources: configs });
      expect(dataSource.getDataSources()).toEqual(['postgres', 'mysql']);
    });

    it('should set default data source', () => {
      const config: DataSourceConfig = {
        name: 'default-db',
        type: DataSourceType.PostgreSQL,
        credentials: {
          type: DataSourceType.PostgreSQL,
          host: 'localhost',
          database: 'test',
          username: 'user',
          password: 'pass',
        },
      };

      dataSource = new DataSource({
        dataSources: [config],
        defaultDataSource: 'default-db',
      });

      expect(dataSource.getDataSources()).toEqual(['default-db']);
    });
  });

  describe('Data Source Management', () => {
    beforeEach(() => {
      dataSource = new DataSource({ dataSources: [] });
    });

    it('should add new data source', async () => {
      const config: DataSourceConfig = {
        name: 'new-source',
        type: DataSourceType.PostgreSQL,
        credentials: {
          type: DataSourceType.PostgreSQL,
          host: 'localhost',
          database: 'test',
          username: 'user',
          password: 'pass',
        },
      };

      await dataSource.addDataSource(config);
      expect(dataSource.getDataSources()).toContain('new-source');
    });

    it('should throw error when adding duplicate data source', async () => {
      const config: DataSourceConfig = {
        name: 'duplicate',
        type: DataSourceType.PostgreSQL,
        credentials: {
          type: DataSourceType.PostgreSQL,
          host: 'localhost',
          database: 'test',
          username: 'user',
          password: 'pass',
        },
      };

      await dataSource.addDataSource(config);
      await expect(dataSource.addDataSource(config)).rejects.toThrow(
        "Data source with name 'duplicate' already exists"
      );
    });

    it('should remove data source', async () => {
      const config: DataSourceConfig = {
        name: 'to-remove',
        type: DataSourceType.PostgreSQL,
        credentials: {
          type: DataSourceType.PostgreSQL,
          host: 'localhost',
          database: 'test',
          username: 'user',
          password: 'pass',
        },
      };

      await dataSource.addDataSource(config);
      expect(dataSource.getDataSources()).toContain('to-remove');

      await dataSource.removeDataSource('to-remove');
      expect(dataSource.getDataSources()).not.toContain('to-remove');
      expect(mockAdapter.close).toHaveBeenCalled();
    });

    it('should update data source configuration', async () => {
      const config: DataSourceConfig = {
        name: 'to-update',
        type: DataSourceType.PostgreSQL,
        credentials: {
          type: DataSourceType.PostgreSQL,
          host: 'localhost',
          database: 'test',
          username: 'user',
          password: 'pass',
        },
      };

      await dataSource.addDataSource(config);

      await dataSource.updateDataSource('to-update', {
        credentials: {
          type: DataSourceType.PostgreSQL,
          host: 'newhost',
          database: 'test',
          username: 'user',
          password: 'pass',
        },
      });

      const updatedConfig = dataSource.getDataSourceConfig('to-update');
      expect(updatedConfig?.credentials).toMatchObject({
        host: 'newhost',
      });
    });

    it('should get data sources by type', async () => {
      const postgresConfig: DataSourceConfig = {
        name: 'postgres',
        type: DataSourceType.PostgreSQL,
        credentials: {
          type: DataSourceType.PostgreSQL,
          host: 'localhost',
          database: 'test',
          username: 'user',
          password: 'pass',
        },
      };

      const mysqlConfig: DataSourceConfig = {
        name: 'mysql',
        type: DataSourceType.MySQL,
        credentials: {
          type: DataSourceType.MySQL,
          host: 'localhost',
          database: 'test',
          username: 'user',
          password: 'pass',
        },
      };

      await dataSource.addDataSource(postgresConfig);
      await dataSource.addDataSource(mysqlConfig);

      const postgresSources = dataSource.getDataSourcesByType(DataSourceType.PostgreSQL);
      expect(postgresSources).toHaveLength(1);
      expect(postgresSources[0]?.name).toBe('postgres');

      const mysqlSources = dataSource.getDataSourcesByType(DataSourceType.MySQL);
      expect(mysqlSources).toHaveLength(1);
      expect(mysqlSources[0]?.name).toBe('mysql');
    });
  });

  describe('Query Execution', () => {
    beforeEach(async () => {
      const config: DataSourceConfig = {
        name: 'test-db',
        type: DataSourceType.PostgreSQL,
        credentials: {
          type: DataSourceType.PostgreSQL,
          host: 'localhost',
          database: 'test',
          username: 'user',
          password: 'pass',
        },
      };

      dataSource = new DataSource({ dataSources: [config] });
    });

    it('should execute query successfully', async () => {
      const result = await dataSource.execute({
        sql: 'SELECT 1 as test',
      });

      expect(result.success).toBe(true);
      expect(result.rows).toEqual([{ test: 'value' }]);
      expect(result.warehouse).toBe('test-db');
      expect(mockAdapter.query).toHaveBeenCalledWith(
        'SELECT 1 as test',
        undefined,
        undefined,
        undefined
      );
    });

    it('should execute query with parameters', async () => {
      const result = await dataSource.execute({
        sql: 'SELECT * FROM users WHERE id = ?',
        params: [123],
      });

      expect(result.success).toBe(true);
      expect(mockAdapter.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ?',
        [123],
        undefined,
        undefined
      );
    });

    it('should route query to specific warehouse', async () => {
      const result = await dataSource.execute({
        sql: 'SELECT 1',
        warehouse: 'test-db',
      });

      expect(result.success).toBe(true);
      expect(result.warehouse).toBe('test-db');
    });

    it('should handle query errors gracefully', async () => {
      vi.mocked(mockAdapter.query).mockRejectedValue(new Error('Query failed'));

      const result = await dataSource.execute({
        sql: 'SELECT * FROM non_existent_table',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('QUERY_EXECUTION_ERROR');
      expect(result.error?.message).toBe('Query failed');
    });

    it('should throw error for non-existent data source', async () => {
      await expect(
        dataSource.execute({
          sql: 'SELECT 1',
          warehouse: 'non-existent',
        })
      ).rejects.toThrow("Specified data source 'non-existent' not found");
    });

    it('should execute query with maxRows option', async () => {
      const result = await dataSource.execute({
        sql: 'SELECT * FROM users',
        options: { maxRows: 100 },
      });

      expect(result.success).toBe(true);
      expect(mockAdapter.query).toHaveBeenCalledWith(
        'SELECT * FROM users',
        undefined,
        100,
        undefined
      );
    });

    it('should include metadata when results are limited', async () => {
      // Mock adapter to return hasMoreRows flag
      vi.mocked(mockAdapter.query).mockResolvedValue({
        rows: [{ test: 'value1' }, { test: 'value2' }],
        fields: [{ name: 'test', type: 'string' }],
        rowCount: 2,
        hasMoreRows: true,
      });

      const result = await dataSource.execute({
        sql: 'SELECT * FROM large_table',
        options: { maxRows: 2 },
      });

      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(2);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.limited).toBe(true);
      expect(result.metadata?.maxRows).toBe(2);
    });

    it('should not include metadata when results are not limited', async () => {
      // Mock adapter to return no hasMoreRows flag
      vi.mocked(mockAdapter.query).mockResolvedValue({
        rows: [{ test: 'value' }],
        fields: [{ name: 'test', type: 'string' }],
        rowCount: 1,
        hasMoreRows: false,
      });

      const result = await dataSource.execute({
        sql: 'SELECT * FROM small_table',
        options: { maxRows: 100 },
      });

      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(1);
      expect(result.metadata?.limited).toBe(false);
    });
  });

  describe('Introspection Methods', () => {
    beforeEach(async () => {
      const config: DataSourceConfig = {
        name: 'test-db',
        type: DataSourceType.PostgreSQL,
        credentials: {
          type: DataSourceType.PostgreSQL,
          host: 'localhost',
          database: 'test',
          username: 'user',
          password: 'pass',
        },
      };

      dataSource = new DataSource({ dataSources: [config] });

      // Setup mock introspector responses
      vi.mocked(mockIntrospector.getDatabases).mockResolvedValue([
        { name: 'test_db', owner: 'admin' },
      ]);
      vi.mocked(mockIntrospector.getSchemas).mockResolvedValue([
        { name: 'public', database: 'test_db' },
      ]);
      vi.mocked(mockIntrospector.getTables).mockResolvedValue([
        {
          name: 'users',
          schema: 'public',
          database: 'test_db',
          type: 'TABLE',
          rowCount: 100,
        },
      ]);
      vi.mocked(mockIntrospector.getColumns).mockResolvedValue([
        {
          name: 'id',
          table: 'users',
          schema: 'public',
          database: 'test_db',
          position: 1,
          dataType: 'integer',
          isNullable: false,
          isPrimaryKey: true,
        },
      ]);
      vi.mocked(mockIntrospector.getViews).mockResolvedValue([
        {
          name: 'user_view',
          schema: 'public',
          database: 'test_db',
          definition: 'SELECT * FROM users',
        },
      ]);
      const fixedDate = new Date('2024-01-01T00:00:00.000Z');
      vi.mocked(mockIntrospector.getTableStatistics).mockResolvedValue({
        table: 'users',
        schema: 'public',
        database: 'test_db',
        rowCount: 100,
        columnStatistics: [
          {
            columnName: 'id',
            distinctCount: 100,
            nullCount: 0,
            minValue: '1',
            maxValue: '100',
            sampleValues: '1,2,3,4,5',
          },
          {
            columnName: 'name',
            distinctCount: 95,
            nullCount: 5,
            minValue: undefined,
            maxValue: undefined,
            sampleValues: 'Alice,Bob,Charlie',
          },
        ],
        lastUpdated: fixedDate,
      });
      vi.mocked(mockIntrospector.getDataSourceType).mockReturnValue('postgresql');
    });

    it('should get introspector instance', async () => {
      const introspector = await dataSource.introspect('test-db');
      expect(introspector).toBeDefined();
      expect(typeof introspector.getDatabases).toBe('function');
      expect(typeof introspector.getSchemas).toBe('function');
      expect(typeof introspector.getTables).toBe('function');
      expect(typeof introspector.getColumns).toBe('function');
      expect(typeof introspector.getViews).toBe('function');
      expect(typeof introspector.getTableStatistics).toBe('function');
      expect(typeof introspector.getColumnStatistics).toBe('function');
      expect(typeof introspector.getFullIntrospection).toBe('function');
      expect(mockAdapter.introspect).toHaveBeenCalled();
    });

    it('should get databases', async () => {
      const databases = await dataSource.getDatabases('test-db');
      expect(databases).toEqual([{ name: 'test_db', owner: 'admin' }]);
      expect(mockIntrospector.getDatabases).toHaveBeenCalled();
    });

    it('should get schemas', async () => {
      const schemas = await dataSource.getSchemas('test-db', 'test_db');
      expect(schemas).toEqual([{ name: 'public', database: 'test_db' }]);
      expect(mockIntrospector.getSchemas).toHaveBeenCalledWith('test_db');
    });

    it('should get tables', async () => {
      const tables = await dataSource.getTables('test-db', 'test_db', 'public');
      expect(tables).toEqual([
        {
          name: 'users',
          schema: 'public',
          database: 'test_db',
          type: 'TABLE',
          rowCount: 100,
        },
      ]);
      expect(mockIntrospector.getTables).toHaveBeenCalledWith('test_db', 'public');
    });

    it('should get columns', async () => {
      const columns = await dataSource.getColumns('test-db', 'test_db', 'public', 'users');
      expect(columns).toEqual([
        {
          name: 'id',
          table: 'users',
          schema: 'public',
          database: 'test_db',
          position: 1,
          dataType: 'integer',
          isNullable: false,
          isPrimaryKey: true,
        },
      ]);
      expect(mockIntrospector.getColumns).toHaveBeenCalledWith('test_db', 'public', 'users');
    });

    it('should get views', async () => {
      const views = await dataSource.getViews('test-db', 'test_db', 'public');
      expect(views).toEqual([
        {
          name: 'user_view',
          schema: 'public',
          database: 'test_db',
          definition: 'SELECT * FROM users',
        },
      ]);
      expect(mockIntrospector.getViews).toHaveBeenCalledWith('test_db', 'public');
    });

    it('should get table statistics', async () => {
      const stats = await dataSource.getTableStatistics('test_db', 'public', 'users', 'test-db');
      expect(stats).toEqual({
        table: 'users',
        schema: 'public',
        database: 'test_db',
        rowCount: 100,
        columnStatistics: [
          {
            columnName: 'id',
            distinctCount: 100,
            nullCount: 0,
            minValue: '1',
            maxValue: '100',
            sampleValues: '1,2,3,4,5',
          },
          {
            columnName: 'name',
            distinctCount: 95,
            nullCount: 5,
            minValue: undefined,
            maxValue: undefined,
            sampleValues: 'Alice,Bob,Charlie',
          },
        ],
        lastUpdated: new Date('2024-01-01T00:00:00.000Z'),
      });
      expect(mockIntrospector.getTableStatistics).toHaveBeenCalledWith(
        'test_db',
        'public',
        'users'
      );
    });

    it('should get full introspection', async () => {
      const mockFullResult = {
        dataSourceName: 'test-db',
        dataSourceType: 'postgresql',
        databases: [{ name: 'test_db', owner: 'admin' }],
        schemas: [{ name: 'public', database: 'test_db' }],
        tables: [],
        columns: [],
        views: [],
        introspectedAt: new Date(),
      };

      vi.mocked(mockIntrospector.getFullIntrospection).mockResolvedValue(mockFullResult);

      const result = await dataSource.getFullIntrospection('test-db');
      expect(result).toEqual(mockFullResult);
      expect(mockIntrospector.getFullIntrospection).toHaveBeenCalled();
    });

    it('should use default data source when none specified', async () => {
      // Create data source with default
      const config: DataSourceConfig = {
        name: 'default-db',
        type: DataSourceType.PostgreSQL,
        credentials: {
          type: DataSourceType.PostgreSQL,
          host: 'localhost',
          database: 'test',
          username: 'user',
          password: 'pass',
        },
      };

      dataSource = new DataSource({
        dataSources: [config],
        defaultDataSource: 'default-db',
      });

      await dataSource.getDatabases(); // No data source specified
      expect(mockAdapter.introspect).toHaveBeenCalled();
    });
  });

  describe('Connection Testing', () => {
    beforeEach(async () => {
      const config: DataSourceConfig = {
        name: 'test-db',
        type: DataSourceType.PostgreSQL,
        credentials: {
          type: DataSourceType.PostgreSQL,
          host: 'localhost',
          database: 'test',
          username: 'user',
          password: 'pass',
        },
      };

      dataSource = new DataSource({ dataSources: [config] });
    });

    it('should test single data source connection', async () => {
      const result = await dataSource.testDataSource('test-db');
      expect(result).toBe(true);
      expect(mockAdapter.testConnection).toHaveBeenCalled();
    });

    it('should handle connection test failure', async () => {
      // Create a simple test that verifies the method catches errors and returns false
      const config: DataSourceConfig = {
        name: 'failing-db',
        type: DataSourceType.PostgreSQL,
        credentials: {
          type: DataSourceType.PostgreSQL,
          host: 'invalid-host',
          database: 'test',
          username: 'user',
          password: 'pass',
        },
      };

      const testDataSource = new DataSource({ dataSources: [config] });

      // Mock createAdapter to throw an error for this specific call
      const { createAdapter } = await import('./adapters/factory');
      vi.mocked(createAdapter).mockRejectedValueOnce(new Error('Connection failed'));

      const result = await testDataSource.testDataSource('failing-db');
      expect(result).toBe(false);

      await testDataSource.close();
    });

    it('should test all data source connections', async () => {
      const results = await dataSource.testAllDataSources();
      expect(results).toEqual({ 'test-db': true });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when no data sources configured and trying to get default', async () => {
      dataSource = new DataSource({ dataSources: [] });

      await expect(dataSource.execute({ sql: 'SELECT 1' })).rejects.toThrow(
        'No data source specified in request and no default data source configured'
      );
    });

    it('should throw error when multiple data sources but no default specified', async () => {
      const configs: DataSourceConfig[] = [
        {
          name: 'db1',
          type: DataSourceType.PostgreSQL,
          credentials: {
            type: DataSourceType.PostgreSQL,
            host: 'localhost',
            database: 'test',
            username: 'user',
            password: 'pass',
          },
        },
        {
          name: 'db2',
          type: DataSourceType.MySQL,
          credentials: {
            type: DataSourceType.MySQL,
            host: 'localhost',
            default_database: 'test',
            username: 'user',
            password: 'pass',
          },
        },
      ];

      dataSource = new DataSource({ dataSources: configs });

      await expect(dataSource.execute({ sql: 'SELECT 1' })).rejects.toThrow(
        'No data source specified in request and no default data source configured'
      );
    });
  });

  describe('Backward Compatibility', () => {
    it('should work with QueryRouter alias', () => {
      const config: DataSourceConfig = {
        name: 'test-db',
        type: DataSourceType.PostgreSQL,
        credentials: {
          type: DataSourceType.PostgreSQL,
          host: 'localhost',
          database: 'test',
          username: 'user',
          password: 'pass',
        },
      };

      const router = new QueryRouter({ dataSources: [config] });
      expect(router.getDataSources()).toEqual(['test-db']);
    });
  });

  describe('Resource Cleanup', () => {
    it('should close all adapters on close', async () => {
      const config: DataSourceConfig = {
        name: 'test-db',
        type: DataSourceType.PostgreSQL,
        credentials: {
          type: DataSourceType.PostgreSQL,
          host: 'localhost',
          database: 'test',
          username: 'user',
          password: 'pass',
        },
      };

      dataSource = new DataSource({ dataSources: [config] });

      // Trigger adapter creation
      await dataSource.execute({ sql: 'SELECT 1' });

      await dataSource.close();
      expect(mockAdapter.close).toHaveBeenCalled();
    });
  });
});
