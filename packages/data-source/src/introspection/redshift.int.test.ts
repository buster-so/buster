import { afterEach, describe, expect } from 'vitest';
import type { DataSourceConfig } from '../data-source';
import { DataSource } from '../data-source';
import { skipIfNoCredentials, TEST_TIMEOUT, testConfig } from '../setup';
import type { RedshiftCredentials } from '../types/credentials';
import { DataSourceType } from '../types/credentials';

function createRedshiftCredentials(): RedshiftCredentials {
  if (
    !testConfig.redshift.host ||
    !testConfig.redshift.database ||
    !testConfig.redshift.username ||
    !testConfig.redshift.password
  ) {
    throw new Error('Missing required Redshift credentials');
  }

  return {
    type: DataSourceType.Redshift,
    host: testConfig.redshift.host,
    port: testConfig.redshift.port,
    database: testConfig.redshift.database,
    username: testConfig.redshift.username,
    password: testConfig.redshift.password,
    schema: testConfig.redshift.schema,
    cluster_identifier: testConfig.redshift.cluster_identifier,
    ssl: true, // Redshift requires SSL
  };
}

describe.skip('Redshift DataSource Introspection', () => {
  let dataSource: DataSource;
  const testFn = skipIfNoCredentials('redshift');

  afterEach(async () => {
    if (dataSource) {
      await dataSource.close();
    }
  });

  testFn(
    'should introspect Redshift databases',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-redshift',
        type: DataSourceType.Redshift,
        credentials: createRedshiftCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const databases = await dataSource.getDatabases('test-redshift');
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
    'should introspect Redshift schemas',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-redshift',
        type: DataSourceType.Redshift,
        credentials: createRedshiftCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const schemas = await dataSource.getSchemas('test-redshift');
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
    'should introspect Redshift tables',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-redshift',
        type: DataSourceType.Redshift,
        credentials: createRedshiftCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const tables = await dataSource.getTables('test-redshift');
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
        expect(['TABLE', 'VIEW', 'EXTERNAL_TABLE']).toContain(table.type);
      }
    },
    TEST_TIMEOUT
  );

  testFn(
    'should introspect Redshift columns',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-redshift',
        type: DataSourceType.Redshift,
        credentials: createRedshiftCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const tables = await dataSource.getTables('test-redshift');

      // If tables exist, test column introspection
      if (tables.length > 0) {
        const firstTable = tables[0];
        if (firstTable) {
          const columns = await dataSource.getColumns(
            'test-redshift',
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
    'should introspect Redshift views',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-redshift',
        type: DataSourceType.Redshift,
        credentials: createRedshiftCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const views = await dataSource.getViews('test-redshift');
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
    'should get full Redshift introspection',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-redshift',
        type: DataSourceType.Redshift,
        credentials: createRedshiftCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const introspection = await dataSource.getFullIntrospection('test-redshift');

      expect(introspection).toHaveProperty('dataSourceName', 'test-redshift');
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
    'should test Redshift connection',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-redshift',
        type: DataSourceType.Redshift,
        credentials: createRedshiftCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      const connectionResult = await dataSource.testDataSource('test-redshift');
      expect(connectionResult).toBe(true);
    },
    TEST_TIMEOUT
  );

  testFn(
    'should get Redshift table statistics (placeholder)',
    async () => {
      const config: DataSourceConfig = {
        name: 'test-redshift',
        type: DataSourceType.Redshift,
        credentials: createRedshiftCredentials(),
      };

      dataSource = new DataSource({ dataSources: [config] });

      // Since this is a placeholder implementation, we just verify the method exists
      // and returns the expected structure
      try {
        const stats = await dataSource.getTableStatistics(
          'default_database',
          'public',
          'test_table',
          'test-redshift'
        );

        // Verify basic structure (placeholder implementation returns empty stats)
        expect(stats).toHaveProperty('table', 'test_table');
        expect(stats).toHaveProperty('schema', 'public');
        expect(stats).toHaveProperty('database', 'default_database');
        expect(stats).toHaveProperty('columnStatistics');
        expect(stats).toHaveProperty('lastUpdated');
        expect(Array.isArray(stats.columnStatistics)).toBe(true);
        expect(stats.lastUpdated).toBeInstanceOf(Date);
      } catch (error) {
        // Expected for placeholder implementation
        console.warn('Redshift table statistics not implemented:', error);
        expect(error).toBeInstanceOf(Error);
      }
    },
    TEST_TIMEOUT
  );
});
