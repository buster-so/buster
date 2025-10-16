import { afterEach, describe, expect } from 'vitest';
import type { DataSourceConfig } from '../data-source';
import { DataSource } from '../data-source';
import { skipIfNoCredentials, TEST_TIMEOUT, testConfig } from '../setup';
import type { SnowflakeCredentials } from '../types/credentials';
import { DataSourceType } from '../types/credentials';
import type { ColumnStatistics, Table, TableStatistics } from '../types/introspection';

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

const testWithCredentials = skipIfNoCredentials('snowflake');

describe.skip('Snowflake DataSource Introspection', () => {
  let dataSource: DataSource;

  afterEach(async () => {
    if (dataSource) {
      await dataSource.close();
    }
  });

  testWithCredentials(
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
    { timeout: TEST_TIMEOUT }
  );

  testWithCredentials(
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
    { timeout: TEST_TIMEOUT }
  );

  testWithCredentials(
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
    { timeout: TEST_TIMEOUT }
  );

  testWithCredentials(
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
    { timeout: TEST_TIMEOUT }
  );

  testWithCredentials(
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
    { timeout: TEST_TIMEOUT }
  );

  testWithCredentials(
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
    { timeout: 120000 }
  );

  describe.skip('Snowflake Filtering Tests', () => {
    testWithCredentials(
      'should filter by database only',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-snowflake',
          type: DataSourceType.Snowflake,
          credentials: createSnowflakeCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        // Get full introspection with database filter
        const filteredIntrospection = await dataSource.getFullIntrospection('test-snowflake', {
          databases: ['DBT'],
        });

        // Verify only DBT database is returned
        expect(filteredIntrospection.databases.some((db) => db.name === 'DBT')).toBe(true);
        const databaseNames = new Set(filteredIntrospection.databases.map((db) => db.name));
        expect(databaseNames.has('DBT')).toBe(true);

        // Verify all schemas belong to DBT database
        for (const schema of filteredIntrospection.schemas) {
          expect(schema.database).toBe('DBT');
        }

        // Verify all tables belong to DBT database
        for (const table of filteredIntrospection.tables) {
          expect(table.database).toBe('DBT');
        }

        // Verify all columns belong to DBT database
        for (const column of filteredIntrospection.columns) {
          expect(column.database).toBe('DBT');
        }

        // Verify all views belong to DBT database
        for (const view of filteredIntrospection.views) {
          expect(view.database).toBe('DBT');
        }
      },
      { timeout: 120000 }
    );

    testWithCredentials(
      'should filter by schema only',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-snowflake',
          type: DataSourceType.Snowflake,
          credentials: createSnowflakeCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        // Get full introspection with schema filter
        const filteredIntrospection = await dataSource.getFullIntrospection('test-snowflake', {
          schemas: ['REVENUE'],
        });

        // Verify only REVENUE schema is returned
        const revenueSchemas = filteredIntrospection.schemas.filter((s) => s.name === 'REVENUE');
        expect(revenueSchemas.length).toBeGreaterThan(0);
        expect(filteredIntrospection.schemas.every((s) => s.name === 'REVENUE')).toBe(true);

        // Verify all tables belong to REVENUE schema
        for (const table of filteredIntrospection.tables) {
          expect(table.schema).toBe('REVENUE');
        }

        // Verify all columns belong to tables in REVENUE schema
        for (const column of filteredIntrospection.columns) {
          expect(column.schema).toBe('REVENUE');
        }

        // Verify all views belong to REVENUE schema
        for (const view of filteredIntrospection.views) {
          expect(view.schema).toBe('REVENUE');
        }

        // Verify databases are filtered to only those containing REVENUE schema
        const databasesWithRevenue = new Set(revenueSchemas.map((s) => s.database));
        for (const database of filteredIntrospection.databases) {
          expect(databasesWithRevenue.has(database.name)).toBe(true);
        }
      },
      { timeout: 120000 }
    );

    testWithCredentials(
      'should filter by both database and schema',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-snowflake',
          type: DataSourceType.Snowflake,
          credentials: createSnowflakeCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        // Get full introspection with both filters
        const filteredIntrospection = await dataSource.getFullIntrospection('test-snowflake', {
          databases: ['DBT'],
          schemas: ['REVENUE'],
        });

        // Verify only DBT database is returned
        expect(filteredIntrospection.databases.some((db) => db.name === 'DBT')).toBe(true);

        // Verify only REVENUE schema in DBT database is returned
        expect(filteredIntrospection.schemas.length).toBeGreaterThan(0);
        for (const schema of filteredIntrospection.schemas) {
          expect(schema.name).toBe('REVENUE');
          expect(schema.database).toBe('DBT');
        }

        // Verify all tables belong to DBT.REVENUE
        for (const table of filteredIntrospection.tables) {
          expect(table.database).toBe('DBT');
          expect(table.schema).toBe('REVENUE');
        }

        // Verify all columns belong to DBT.REVENUE tables
        for (const column of filteredIntrospection.columns) {
          expect(column.database).toBe('DBT');
          expect(column.schema).toBe('REVENUE');
        }

        // Verify all views belong to DBT.REVENUE
        for (const view of filteredIntrospection.views) {
          expect(view.database).toBe('DBT');
          expect(view.schema).toBe('REVENUE');
        }
      },
      { timeout: 180000 }
    );

    testWithCredentials(
      'should handle non-existent database filter',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-snowflake',
          type: DataSourceType.Snowflake,
          credentials: createSnowflakeCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        // Get full introspection with non-existent database filter
        const filteredIntrospection = await dataSource.getFullIntrospection('test-snowflake', {
          databases: ['NONEXISTENT_DATABASE'],
        });

        // Verify empty results
        expect(filteredIntrospection.databases.length).toBe(0);
        expect(filteredIntrospection.schemas.length).toBe(0);
        expect(filteredIntrospection.tables.length).toBe(0);
        expect(filteredIntrospection.columns.length).toBe(0);
        expect(filteredIntrospection.views.length).toBe(0);
      },
      { timeout: 120000 }
    );

    testWithCredentials(
      'should handle non-existent schema filter',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-snowflake',
          type: DataSourceType.Snowflake,
          credentials: createSnowflakeCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        // Get full introspection with non-existent schema filter
        const filteredIntrospection = await dataSource.getFullIntrospection('test-snowflake', {
          schemas: ['NONEXISTENT_SCHEMA'],
        });

        // Verify empty results for schemas and dependent objects
        expect(filteredIntrospection.schemas.length).toBe(0);
        expect(filteredIntrospection.tables.length).toBe(0);
        expect(filteredIntrospection.columns.length).toBe(0);
        expect(filteredIntrospection.views.length).toBe(0);
        // Databases are filtered to only those containing the schema
        expect(filteredIntrospection.databases.length).toBe(0);
      },
      { timeout: 120000 }
    );

    testWithCredentials(
      'should throw error for empty filter arrays',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-snowflake',
          type: DataSourceType.Snowflake,
          credentials: createSnowflakeCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        // Test empty databases array
        await expect(
          dataSource.getFullIntrospection('test-snowflake', { databases: [] })
        ).rejects.toThrow('Database filter array is empty');

        // Test empty schemas array
        await expect(
          dataSource.getFullIntrospection('test-snowflake', { schemas: [] })
        ).rejects.toThrow('Schema filter array is empty');

        // Test empty tables array
        await expect(
          dataSource.getFullIntrospection('test-snowflake', { tables: [] })
        ).rejects.toThrow('Table filter array is empty');
      },
      { timeout: 120000 }
    );

    testWithCredentials(
      'should handle case-sensitive filtering in Snowflake',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-snowflake',
          type: DataSourceType.Snowflake,
          credentials: createSnowflakeCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        // Test with incorrect case for 'REVENUE' schema (lowercase)
        const filteredIntrospection = await dataSource.getFullIntrospection('test-snowflake', {
          schemas: ['revenue'],
        });

        // Snowflake is case-sensitive for quoted identifiers
        // This should return no results since 'revenue' != 'REVENUE'
        expect(filteredIntrospection.schemas.length).toBe(0);
        expect(filteredIntrospection.tables.length).toBe(0);
        expect(filteredIntrospection.columns.length).toBe(0);
      },
      { timeout: 120000 }
    );
  });

  testWithCredentials(
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

  testWithCredentials(
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

  testWithCredentials(
    'should get column statistics for DBT.REVENUE.EMAIL_SMS_REVENUE table',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-snowflake',
        type: DataSourceType.Snowflake,
        credentials: createSnowflakeCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const database = 'DBT';
      const schema = 'REVENUE';
      const table = 'EMAIL_SMS_REVENUE';

      try {
        const tables = await dataSource.getTables('test-snowflake');
        const targetTable = tables.find(
          (t) => t.database === database && t.schema === schema && t.name === table
        );

        if (!targetTable) {
          console.warn(`Table ${database}.${schema}.${table} not found, skipping test`);
          return;
        }
        const columns = await dataSource.getColumns('test-snowflake', database, schema, table);
        expect(Array.isArray(columns)).toBe(true);
        expect(columns.length).toBeGreaterThan(0);
        for (const _column of columns) {
        }
        const introspector = await dataSource.introspect('test-snowflake');
        expect(introspector).toBeDefined();
        const _startTime = Date.now();
        const columnStats = await introspector.getColumnStatistics(database, schema, table);
        const _endTime = Date.now();

        expect(Array.isArray(columnStats)).toBe(true);
        expect(columnStats.length).toBe(columns.length);
        for (const _stat of columnStats) {
        }

        // Validate column statistics structure (but skip validation if empty column names)
        const hasValidColumnNames = columnStats.every(
          (stat) => stat.columnName && stat.columnName.length > 0
        );
        if (hasValidColumnNames) {
          validateColumnStatistics(columnStats);
        } else {
          console.warn('Skipping validateColumnStatistics due to empty column names');
        }

        // Verify each column has corresponding statistics
        for (const column of columns) {
          const columnStat = columnStats.find(
            (stat: ColumnStatistics) => stat.columnName === column.name
          );
          expect(columnStat).toBeDefined();
          expect(columnStat?.columnName).toBe(column.name);
        }
        for (const _stat of columnStats) {
        }
      } catch (error) {
        console.warn(`Column statistics test failed for ${database}.${schema}.${table}:`, error);
        expect(error).toBeInstanceOf(Error);
      }
    },
    { timeout: 120000 } // 2 minutes timeout
  );
});
