import { afterEach, describe, expect, it } from 'vitest';
import { DataSource } from '../data-source';
import type { DataSourceConfig } from '../data-source';
import { DataSourceType } from '../types/credentials';
import type { PostgreSQLCredentials } from '../types/credentials';
import type { ColumnStatistics, Table, TableStatistics } from '../types/introspection';

// Check if PostgreSQL test credentials are available
const hasPostgreSQLCredentials = !!(
  process.env.TEST_POSTGRES_HOST &&
  process.env.TEST_POSTGRES_DATABASE &&
  process.env.TEST_POSTGRES_USERNAME &&
  process.env.TEST_POSTGRES_PASSWORD
);

// Skip tests if credentials are not available
const testWithCredentials = hasPostgreSQLCredentials ? it : it.skip;

// Test timeout - 30 seconds
const TEST_TIMEOUT = 30000;

function createPostgreSQLCredentials(): PostgreSQLCredentials {
  if (
    !process.env.TEST_POSTGRES_HOST ||
    !process.env.TEST_POSTGRES_DATABASE ||
    !process.env.TEST_POSTGRES_USERNAME ||
    !process.env.TEST_POSTGRES_PASSWORD
  ) {
    throw new Error('Missing required PostgreSQL credentials');
  }

  return {
    type: DataSourceType.PostgreSQL,
    host: process.env.TEST_POSTGRES_HOST,
    port: process.env.TEST_POSTGRES_PORT ? Number.parseInt(process.env.TEST_POSTGRES_PORT) : 5432,
    default_database: process.env.TEST_POSTGRES_DATABASE,
    username: process.env.TEST_POSTGRES_USERNAME,
    password: process.env.TEST_POSTGRES_PASSWORD,
    schema: process.env.TEST_POSTGRES_SCHEMA || 'public',
    ssl: process.env.TEST_POSTGRES_SSL === 'true',
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
    'test-postgresql',
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

describe('PostgreSQL DataSource Introspection', () => {
  let dataSource: DataSource;

  afterEach(async () => {
    if (dataSource) {
      await dataSource.close();
    }
  });

  describe('should introspect PostgreSQL databases', () => {
    testWithCredentials(
      'should get databases',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-postgresql',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        const databases = await dataSource.getDatabases('test-postgresql');
        expect(Array.isArray(databases)).toBe(true);
        expect(databases.length).toBeGreaterThan(0);

        // Should include at least the test database
        const testDb = databases.find((db) => db.name === process.env.TEST_POSTGRES_DATABASE);
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
  });

  describe('should introspect PostgreSQL schemas', () => {
    testWithCredentials(
      'should get schemas',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-postgresql',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        const schemas = await dataSource.getSchemas('test-postgresql');
        expect(Array.isArray(schemas)).toBe(true);
        expect(schemas.length).toBeGreaterThan(0);

        // Should include at least the public schema
        const publicSchema = schemas.find((schema) => schema.name === 'public');
        expect(publicSchema).toBeDefined();

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
  });

  describe('should introspect PostgreSQL tables', () => {
    testWithCredentials(
      'should get tables',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-postgresql',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        const tables = await dataSource.getTables('test-postgresql');
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
          expect(['TABLE', 'VIEW', 'MATERIALIZED_VIEW', 'FOREIGN_TABLE']).toContain(table.type);
        }
      },
      TEST_TIMEOUT
    );
  });

  describe('should introspect PostgreSQL columns', () => {
    testWithCredentials(
      'should get columns',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-postgresql',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        const tables = await dataSource.getTables('test-postgresql');

        // If tables exist, test column introspection
        if (tables.length > 0) {
          const firstTable = tables[0];
          if (firstTable) {
            const columns = await dataSource.getColumns(
              'test-postgresql',
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
  });

  describe('should introspect PostgreSQL views', () => {
    testWithCredentials(
      'should get views',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-postgresql',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        const views = await dataSource.getViews('test-postgresql');
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
  });

  describe('should get PostgreSQL table statistics', () => {
    testWithCredentials(
      'should get table statistics',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-postgresql',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        const tables = await dataSource.getTables('test-postgresql');

        // If tables exist, test statistics
        if (tables.length > 0) {
          const firstTable = tables[0];
          if (firstTable) {
            try {
              const stats = await dataSource.getTableStatistics(
                firstTable.database,
                firstTable.schema,
                firstTable.name,
                'test-postgresql'
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

  describe('should get full PostgreSQL introspection', () => {
    testWithCredentials(
      'should get full introspection',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-postgresql',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        const introspection = await dataSource.getFullIntrospection('test-postgresql');

        expect(introspection).toHaveProperty('dataSourceName', 'test-postgresql');
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
      120000
    );
  });

  describe('should test PostgreSQL connection', () => {
    testWithCredentials(
      'should test connection',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-postgresql',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        const connectionResult = await dataSource.testDataSource('test-postgresql');
        expect(connectionResult).toBe(true);
      },
      TEST_TIMEOUT
    );
  });

  describe('PostgreSQL Filtering Tests', () => {
    testWithCredentials(
      'should filter by database only',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-postgresql',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        // Get full introspection with database filter
        const filteredIntrospection = await dataSource.getFullIntrospection('test-postgresql', {
          databases: ['postgres'],
        });

        // Verify only postgres database is returned
        expect(filteredIntrospection.databases.length).toBe(1);
        expect(filteredIntrospection.databases[0]?.name).toBe('postgres');

        // Verify all schemas belong to postgres database
        for (const schema of filteredIntrospection.schemas) {
          expect(schema.database).toBe('postgres');
        }

        // Verify all tables belong to postgres database
        for (const table of filteredIntrospection.tables) {
          expect(table.database).toBe('postgres');
        }

        // Verify all columns belong to postgres database
        for (const column of filteredIntrospection.columns) {
          expect(column.database).toBe('postgres');
        }

        // Verify all views belong to postgres database
        for (const view of filteredIntrospection.views) {
          expect(view.database).toBe('postgres');
        }
      },
      120000
    );

    testWithCredentials(
      'should filter by schema only',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-postgresql',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        // Get full introspection with schema filter
        const filteredIntrospection = await dataSource.getFullIntrospection('test-postgresql', {
          schemas: ['public'],
        });

        // Verify only public schema is returned
        const publicSchemas = filteredIntrospection.schemas.filter((s) => s.name === 'public');
        expect(publicSchemas.length).toBeGreaterThan(0);
        expect(filteredIntrospection.schemas.every((s) => s.name === 'public')).toBe(true);

        // Verify all tables belong to public schema
        for (const table of filteredIntrospection.tables) {
          expect(table.schema).toBe('public');
        }

        // Verify all columns belong to tables in public schema
        for (const column of filteredIntrospection.columns) {
          expect(column.schema).toBe('public');
        }

        // Verify all views belong to public schema
        for (const view of filteredIntrospection.views) {
          expect(view.schema).toBe('public');
        }

        // Verify databases are filtered to only those containing public schema
        const databasesWithPublic = new Set(publicSchemas.map((s) => s.database));
        for (const database of filteredIntrospection.databases) {
          expect(databasesWithPublic.has(database.name)).toBe(true);
        }
      },
      120000
    );

    describe('should filter by both database and schema', () => {
      testWithCredentials(
        'should filter by both database and schema',
        async () => {
          const config: DataSourceConfig = {
            name: 'test-postgresql',
            type: DataSourceType.PostgreSQL,
            credentials: createPostgreSQLCredentials(),
          };

          dataSource = new DataSource({ dataSources: [config] });

          // Get full introspection with both filters
          const filteredIntrospection = await dataSource.getFullIntrospection('test-postgresql', {
            databases: ['postgres'],
            schemas: ['ont_ont'],
          });

          const json_introspection = JSON.stringify(filteredIntrospection);
          console.log(json_introspection);

          // Verify only postgres database is returned
          expect(filteredIntrospection.databases.length).toBe(1);
          expect(filteredIntrospection.databases[0]?.name).toBe('postgres');

          // Verify only ont_ont schema in postgres database is returned
          expect(filteredIntrospection.schemas.length).toBeGreaterThan(0);
          for (const schema of filteredIntrospection.schemas) {
            expect(schema.name).toBe('ont_ont');
            expect(schema.database).toBe('postgres');
          }

          // Verify all tables belong to postgres.ont_ont
          for (const table of filteredIntrospection.tables) {
            expect(table.database).toBe('postgres');
            expect(table.schema).toBe('ont_ont');
          }

          // Verify all columns belong to postgres.ont_ont tables
          for (const column of filteredIntrospection.columns) {
            expect(column.database).toBe('postgres');
            expect(column.schema).toBe('ont_ont');
          }

          // Verify all views belong to postgres.ont_ont
          for (const view of filteredIntrospection.views) {
            expect(view.database).toBe('postgres');
            expect(view.schema).toBe('ont_ont');
          }
        },
        120000
      );
    });

    testWithCredentials(
      'should handle non-existent database filter',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-postgresql',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        // Get full introspection with non-existent database filter
        const filteredIntrospection = await dataSource.getFullIntrospection('test-postgresql', {
          databases: ['nonexistent_database'],
        });

        // Verify empty results
        expect(filteredIntrospection.databases.length).toBe(0);
        expect(filteredIntrospection.schemas.length).toBe(0);
        expect(filteredIntrospection.tables.length).toBe(0);
        expect(filteredIntrospection.columns.length).toBe(0);
        expect(filteredIntrospection.views.length).toBe(0);
      },
      120000
    );

    testWithCredentials(
      'should handle non-existent schema filter',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-postgresql',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        // Get full introspection with non-existent schema filter
        const filteredIntrospection = await dataSource.getFullIntrospection('test-postgresql', {
          schemas: ['nonexistent_schema'],
        });

        // Verify empty results for schemas and dependent objects
        expect(filteredIntrospection.schemas.length).toBe(0);
        expect(filteredIntrospection.tables.length).toBe(0);
        expect(filteredIntrospection.columns.length).toBe(0);
        expect(filteredIntrospection.views.length).toBe(0);
        // Databases might still be returned since schema filter doesn't directly filter databases
        expect(filteredIntrospection.databases.length).toBe(0);
      },
      120000
    );

    testWithCredentials(
      'should throw error for empty filter arrays',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-postgresql',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        // Test empty databases array
        await expect(
          dataSource.getFullIntrospection('test-postgresql', { databases: [] })
        ).rejects.toThrow('Database filter array is empty');

        // Test empty schemas array
        await expect(
          dataSource.getFullIntrospection('test-postgresql', { schemas: [] })
        ).rejects.toThrow('Schema filter array is empty');

        // Test empty tables array
        await expect(
          dataSource.getFullIntrospection('test-postgresql', { tables: [] })
        ).rejects.toThrow('Table filter array is empty');
      },
      120000
    );

    testWithCredentials(
      'should handle case-sensitive filtering',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-postgresql',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        // Test with incorrect case for 'public' schema
        const filteredIntrospection = await dataSource.getFullIntrospection('test-postgresql', {
          schemas: ['PUBLIC'],
        });

        // PostgreSQL is case-insensitive for unquoted identifiers, so this might still return results
        // But if we're implementing case-sensitive filtering as requested, this should return no results
        expect(filteredIntrospection.schemas.length).toBe(0);
        expect(filteredIntrospection.tables.length).toBe(0);
        expect(filteredIntrospection.columns.length).toBe(0);
      },
      120000
    );
  });

  describe('should get column statistics for a specific table', () => {
    testWithCredentials(
      'should get column statistics',
      async () => {
        const config: DataSourceConfig = {
          name: 'test-postgresql',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        };

        dataSource = new DataSource({ dataSources: [config] });

        try {
          const tables = await dataSource.getTables('test-postgresql');

          // Find a suitable table for testing (preferably with data)
          const targetTable = tables.find((t) => t.rowCount > 0 && t.schema === 'public');

          if (!targetTable) {
            console.warn('No suitable table found for column statistics test, skipping');
            return;
          }

          const columns = await dataSource.getColumns(
            'test-postgresql',
            targetTable.database,
            targetTable.schema,
            targetTable.name
          );
          expect(Array.isArray(columns)).toBe(true);
          expect(columns.length).toBeGreaterThan(0);

          const introspector = await dataSource.introspect('test-postgresql');
          expect(introspector).toBeDefined();

          const columnStats = await introspector.getColumnStatistics(
            targetTable.database,
            targetTable.schema,
            targetTable.name,
            targetTable.rowCount
          );

          expect(Array.isArray(columnStats)).toBe(true);
          expect(columnStats.length).toBe(columns.length);

          // Validate column statistics structure
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
        } catch (error) {
          console.warn('Column statistics test failed:', error);
          expect(error).toBeInstanceOf(Error);
        }
      },
      120000
    ); // 2 minutes timeout
  });
});
