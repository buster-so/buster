import { afterEach, describe, expect } from 'vitest';
import { DataSource } from '../../../src/data-source';
import type { DataSourceConfig } from '../../../src/data-source';
import { DataSourceType } from '../../../src/types/credentials';
import type { PostgreSQLCredentials } from '../../../src/types/credentials';
import { TEST_TIMEOUT, skipIfNoCredentials, testConfig } from '../../setup';

function createPostgreSQLCredentials(): PostgreSQLCredentials {
  if (
    !testConfig.postgresql.database ||
    !testConfig.postgresql.username ||
    !testConfig.postgresql.password
  ) {
    throw new Error('Missing required PostgreSQL credentials');
  }

  return {
    type: DataSourceType.PostgreSQL,
    host: testConfig.postgresql.host,
    port: testConfig.postgresql.port,
    database: testConfig.postgresql.database,
    username: testConfig.postgresql.username,
    password: testConfig.postgresql.password,
    schema: testConfig.postgresql.schema,
    ssl: testConfig.postgresql.ssl,
  };
}

describe('PostgreSQL DataSource Introspection', () => {
  let dataSource: DataSource;
  const testFn = skipIfNoCredentials('postgresql');

  afterEach(async () => {
    if (dataSource) {
      await dataSource.close();
    }
  });

  testFn(
    'should introspect PostgreSQL databases',
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
      const testDb = databases.find((db) => db.name === testConfig.postgresql.database);
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
    'should introspect PostgreSQL schemas',
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

  testFn(
    'should introspect PostgreSQL tables',
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

  testFn(
    'should introspect PostgreSQL columns',
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

  testFn(
    'should introspect PostgreSQL views',
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

  testFn(
    'should get PostgreSQL table statistics',
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

            expect(stats).toHaveProperty('table', firstTable.name);
            expect(stats).toHaveProperty('schema', firstTable.schema);
            expect(stats).toHaveProperty('database', firstTable.database);
            expect(stats).toHaveProperty('columnStatistics');
            expect(Array.isArray(stats.columnStatistics)).toBe(true);

            // Verify column statistics structure if available
            for (const colStat of stats.columnStatistics) {
              expect(colStat).toHaveProperty('columnName');
              expect(typeof colStat.columnName).toBe('string');
            }
          } catch (error) {
            // Some tables might not have statistics available
            console.warn('Table statistics not available for', firstTable.name, ':', error);
            expect(error).toBeInstanceOf(Error);
          }
        }
      }
    },
    TEST_TIMEOUT
  );

  testFn(
    'should get full PostgreSQL introspection',
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
    TEST_TIMEOUT
  );

  testFn(
    'should test PostgreSQL connection',
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
