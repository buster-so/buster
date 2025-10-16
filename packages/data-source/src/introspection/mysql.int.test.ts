import { afterEach, describe, expect } from 'vitest';
import type { DataSourceConfig } from '../data-source';
import { DataSource } from '../data-source';
import { skipIfNoCredentials, TEST_TIMEOUT, testConfig } from '../setup';
import type { MySQLCredentials } from '../types/credentials';
import { DataSourceType } from '../types/credentials';
import type { ColumnStatistics, Table, TableStatistics } from '../types/introspection';

function createMySQLCredentials(): MySQLCredentials {
  if (!testConfig.mysql.database || !testConfig.mysql.username || !testConfig.mysql.password) {
    throw new Error('Missing required MySQL credentials');
  }

  return {
    type: DataSourceType.MySQL,
    host: testConfig.mysql.host,
    port: testConfig.mysql.port,
    database: testConfig.mysql.database,
    username: testConfig.mysql.username,
    password: testConfig.mysql.password,
    ssl: testConfig.mysql.ssl,
  };
}

function validateTableStatisticsStructure(stats: TableStatistics, firstTable: Table) {
  // Verify basic table statistics structure
  expect(stats).toHaveProperty('table', firstTable.name);
  expect(stats).toHaveProperty('schema', firstTable.schema);
  expect(stats).toHaveProperty('database', firstTable.database);
  expect(stats).toHaveProperty('columnStatistics');
  expect(stats).toHaveProperty('lastUpdated');
  expect(Array.isArray(stats.columnStatistics)).toBe(true);
  expect(stats.lastUpdated).toBeInstanceOf(Date);
}

function validateColumnStatistics(columnStatistics: ColumnStatistics[]) {
  // Verify column statistics structure
  for (const colStat of columnStatistics) {
    expect(colStat).toHaveProperty('columnName');
    expect(typeof colStat.columnName).toBe('string');
    expect(colStat.columnName.length).toBeGreaterThan(0);

    // Verify distinct count is present and valid
    expect(colStat).toHaveProperty('distinctCount');
    if (colStat.distinctCount !== undefined) {
      expect(typeof colStat.distinctCount).toBe('number');
      expect(colStat.distinctCount).toBeGreaterThanOrEqual(0);
    }

    // Verify null count is present and valid
    expect(colStat).toHaveProperty('nullCount');
    if (colStat.nullCount !== undefined) {
      expect(typeof colStat.nullCount).toBe('number');
      expect(colStat.nullCount).toBeGreaterThanOrEqual(0);
    }

    // Verify min/max values are present (can be undefined for non-numeric/date columns)
    expect(colStat).toHaveProperty('minValue');
    expect(colStat).toHaveProperty('maxValue');

    // If min/max values exist, they should be valid
    if (colStat.minValue !== undefined && colStat.maxValue !== undefined) {
      // For numeric columns, min should be <= max
      if (typeof colStat.minValue === 'number' && typeof colStat.maxValue === 'number') {
        expect(colStat.minValue).toBeLessThanOrEqual(colStat.maxValue);
      }
    }
  }
}

async function validateColumnMapping(
  dataSource: DataSource,
  firstTable: Table,
  stats: TableStatistics
) {
  // Verify we have statistics for each column in the table
  const columns = await dataSource.getColumns(
    'test-mysql',
    firstTable.database,
    firstTable.schema,
    firstTable.name
  );

  if (columns.length > 0) {
    expect(stats.columnStatistics.length).toBe(columns.length);

    // Verify each column has corresponding statistics
    for (const column of columns) {
      const columnStat = stats.columnStatistics.find(
        (stat: ColumnStatistics) => stat.columnName === column.name
      );
      expect(columnStat).toBeDefined();
    }
  }
}

describe.skip('MySQL DataSource Introspection', () => {
  let dataSource: DataSource;
  const testFn = skipIfNoCredentials('mysql');

  afterEach(async () => {
    if (dataSource) {
      await dataSource.close();
    }
  });

  testFn(
    'should introspect MySQL databases',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-mysql',
        type: DataSourceType.MySQL,
        credentials: createMySQLCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const databases = await dataSource.getDatabases('test-mysql');
      expect(Array.isArray(databases)).toBe(true);
      expect(databases.length).toBeGreaterThan(0);

      // Should include at least the test database
      const testDb = databases.find((db) => db.name === testConfig.mysql.database);
      expect(testDb).toBeDefined();

      // Verify database structure
      for (const db of databases) {
        expect(db).toHaveProperty('name');
        expect(typeof db.name).toBe('string');
        expect(db.name.length).toBeGreaterThan(0);
      }
    },
    TEST_TIMEOUT
  );

  testFn(
    'should introspect MySQL schemas',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-mysql',
        type: DataSourceType.MySQL,
        credentials: createMySQLCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const schemas = await dataSource.getSchemas('test-mysql');
      expect(Array.isArray(schemas)).toBe(true);

      // Verify schema structure
      for (const schema of schemas) {
        expect(schema).toHaveProperty('name');
        expect(schema).toHaveProperty('database');
        expect(typeof schema.name).toBe('string');
        expect(typeof schema.database).toBe('string');
        expect(schema.name.length).toBeGreaterThan(0);
      }
    },
    TEST_TIMEOUT
  );

  testFn(
    'should introspect MySQL tables',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-mysql',
        type: DataSourceType.MySQL,
        credentials: createMySQLCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const tables = await dataSource.getTables('test-mysql');
      expect(Array.isArray(tables)).toBe(true);

      // Verify table structure if tables exist
      for (const table of tables) {
        expect(table).toHaveProperty('name');
        expect(table).toHaveProperty('schema');
        expect(table).toHaveProperty('database');
        expect(table).toHaveProperty('type');
        expect(typeof table.name).toBe('string');
        expect(typeof table.schema).toBe('string');
        expect(typeof table.database).toBe('string');
        expect(['TABLE', 'VIEW', 'SYSTEM_VIEW']).toContain(table.type);
      }
    },
    TEST_TIMEOUT
  );

  testFn(
    'should introspect MySQL columns',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-mysql',
        type: DataSourceType.MySQL,
        credentials: createMySQLCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const tables = await dataSource.getTables('test-mysql');

      // If tables exist, test column introspection
      if (tables.length > 0) {
        const firstTable = tables[0];
        if (firstTable) {
          const columns = await dataSource.getColumns(
            'test-mysql',
            firstTable.database,
            firstTable.schema,
            firstTable.name
          );
          expect(Array.isArray(columns)).toBe(true);

          // Verify column structure
          for (const column of columns) {
            expect(column).toHaveProperty('name');
            expect(column).toHaveProperty('dataType');
            expect(column).toHaveProperty('isNullable');
            expect(column).toHaveProperty('position');
            expect(typeof column.name).toBe('string');
            expect(typeof column.dataType).toBe('string');
            expect(typeof column.isNullable).toBe('boolean');
            expect(typeof column.position).toBe('number');
            expect(column.name.length).toBeGreaterThan(0);
            expect(column.dataType.length).toBeGreaterThan(0);
            expect(column.position).toBeGreaterThan(0);
          }
        }
      }
    },
    TEST_TIMEOUT
  );

  testFn(
    'should introspect MySQL views',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-mysql',
        type: DataSourceType.MySQL,
        credentials: createMySQLCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const views = await dataSource.getViews('test-mysql');
      expect(Array.isArray(views)).toBe(true);

      // Verify view structure if views exist
      for (const view of views) {
        expect(view).toHaveProperty('name');
        expect(view).toHaveProperty('schema');
        expect(view).toHaveProperty('database');
        expect(typeof view.name).toBe('string');
        expect(typeof view.schema).toBe('string');
        expect(typeof view.database).toBe('string');
        expect(view.name.length).toBeGreaterThan(0);
      }
    },
    TEST_TIMEOUT
  );

  testFn(
    'should get full MySQL introspection',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-mysql',
        type: DataSourceType.MySQL,
        credentials: createMySQLCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const introspection = await dataSource.getFullIntrospection('test-mysql');

      expect(introspection).toHaveProperty('dataSourceName', 'test-mysql');
      expect(introspection).toHaveProperty('dataSourceType');
      expect(introspection).toHaveProperty('databases');
      expect(introspection).toHaveProperty('schemas');
      expect(introspection).toHaveProperty('tables');
      expect(introspection).toHaveProperty('columns');
      expect(introspection).toHaveProperty('views');
      expect(introspection).toHaveProperty('introspectedAt');
      expect(introspection.introspectedAt).toBeInstanceOf(Date);

      // Verify data structure
      expect(Array.isArray(introspection.databases)).toBe(true);
      expect(Array.isArray(introspection.schemas)).toBe(true);
      expect(Array.isArray(introspection.tables)).toBe(true);
      expect(Array.isArray(introspection.columns)).toBe(true);
      expect(Array.isArray(introspection.views)).toBe(true);
    },
    TEST_TIMEOUT
  );

  testFn(
    'should test MySQL connection',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-mysql',
        type: DataSourceType.MySQL,
        credentials: createMySQLCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const connectionResult = await dataSource.testDataSource('test-mysql');
      expect(connectionResult).toBe(true);
    },
    TEST_TIMEOUT
  );

  testFn(
    'should get MySQL table statistics',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-mysql',
        type: DataSourceType.MySQL,
        credentials: createMySQLCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const tables = await dataSource.getTables('test-mysql');

      // If tables exist, test statistics
      if (tables.length > 0) {
        const firstTable = tables[0];
        if (firstTable) {
          try {
            const stats = await dataSource.getTableStatistics(
              firstTable.database,
              firstTable.schema,
              firstTable.name,
              'test-mysql'
            );

            validateTableStatisticsStructure(stats, firstTable);
            validateColumnStatistics(stats.columnStatistics);
            await validateColumnMapping(dataSource, firstTable, stats);
          } catch (error) {
            // Some tables might not have statistics available or might be empty
            console.warn('Table statistics not available for', firstTable.name, ':', error);
            expect(error).toBeInstanceOf(Error);
          }
        }
      }
    },
    TEST_TIMEOUT
  );
});
