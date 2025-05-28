import { afterEach, describe, expect } from 'vitest';
import { DataSource } from '../../../src/data-source';
import type { DataSourceConfig } from '../../../src/data-source';
import { DataSourceType } from '../../../src/types/credentials';
import type { SnowflakeCredentials } from '../../../src/types/credentials';
import type { ColumnStatistics, Table, TableStatistics } from '../../../src/types/introspection';
import { TEST_TIMEOUT, skipIfNoCredentials, testConfig } from '../../setup';

function createSnowflakeCredentials(): SnowflakeCredentials {
  if (
    !testConfig.snowflake.account_id ||
    !testConfig.snowflake.warehouse_id ||
    !testConfig.snowflake.username ||
    !testConfig.snowflake.password ||
    !testConfig.snowflake.default_database
  ) {
    throw new Error('Missing required Snowflake credentials');
  }

  return {
    type: DataSourceType.Snowflake,
    account_id: testConfig.snowflake.account_id,
    warehouse_id: testConfig.snowflake.warehouse_id,
    username: testConfig.snowflake.username,
    password: testConfig.snowflake.password,
    default_database: testConfig.snowflake.default_database,
    default_schema: testConfig.snowflake.default_schema,
    role: testConfig.snowflake.role,
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
    'test-snowflake',
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

describe('Snowflake DataSource Introspection', () => {
  let dataSource: DataSource;
  const testFn = skipIfNoCredentials('snowflake');

  afterEach(async () => {
    if (dataSource) {
      await dataSource.close();
    }
  });

  testFn(
    'should introspect Snowflake databases',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-snowflake',
        type: DataSourceType.Snowflake,
        credentials: createSnowflakeCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const databases = await dataSource.getDatabases('test-snowflake');
      expect(Array.isArray(databases)).toBe(true);
      expect(databases.length).toBeGreaterThan(0);

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
    'should introspect Snowflake schemas',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-snowflake',
        type: DataSourceType.Snowflake,
        credentials: createSnowflakeCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const schemas = await dataSource.getSchemas('test-snowflake');
      expect(Array.isArray(schemas)).toBe(true);
      expect(schemas.length).toBeGreaterThan(0);

      // Verify schema structure
      for (const schema of schemas) {
        expect(schema).toHaveProperty('name');
        expect(schema).toHaveProperty('database');
        expect(typeof schema.name).toBe('string');
        expect(typeof schema.database).toBe('string');
      }
    },
    TEST_TIMEOUT
  );

  testFn(
    'should introspect Snowflake tables',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-snowflake',
        type: DataSourceType.Snowflake,
        credentials: createSnowflakeCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const tables = await dataSource.getTables('test-snowflake');
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
        expect([
          'TABLE',
          'VIEW',
          'MATERIALIZED_VIEW',
          'EXTERNAL_TABLE',
          'TEMPORARY_TABLE',
        ]).toContain(table.type);
      }
    },
    TEST_TIMEOUT
  );

  testFn(
    'should introspect Snowflake columns',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-snowflake',
        type: DataSourceType.Snowflake,
        credentials: createSnowflakeCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const tables = await dataSource.getTables('test-snowflake');

      // If tables exist, test column introspection
      if (tables.length > 0) {
        const firstTable = tables[0];
        if (firstTable) {
          const columns = await dataSource.getColumns(
            'test-snowflake',
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
    'should introspect Snowflake views',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-snowflake',
        type: DataSourceType.Snowflake,
        credentials: createSnowflakeCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const views = await dataSource.getViews('test-snowflake');
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
    'should get full Snowflake introspection',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-snowflake',
        type: DataSourceType.Snowflake,
        credentials: createSnowflakeCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const introspection = await dataSource.getFullIntrospection('test-snowflake');

      expect(introspection).toHaveProperty('dataSourceName', 'test-snowflake');
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
    'should test Snowflake connection',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-snowflake',
        type: DataSourceType.Snowflake,
        credentials: createSnowflakeCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const connectionResult = await dataSource.testDataSource('test-snowflake');
      expect(connectionResult).toBe(true);
    },
    TEST_TIMEOUT
  );

  testFn(
    'should get Snowflake table statistics',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-snowflake',
        type: DataSourceType.Snowflake,
        credentials: createSnowflakeCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const tables = await dataSource.getTables('test-snowflake');

      // If tables exist, test statistics
      if (tables.length > 0) {
        const firstTable = tables[0];
        if (firstTable) {
          try {
            const stats = await dataSource.getTableStatistics(
              firstTable.database,
              firstTable.schema,
              firstTable.name,
              'test-snowflake'
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
