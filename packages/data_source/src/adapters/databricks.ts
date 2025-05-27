import { DBSQLClient } from '@databricks/sql';
import type IDBSQLSession from '@databricks/sql/dist/contracts/IDBSQLSession';
import type IOperation from '@databricks/sql/dist/contracts/IOperation';
import type { DataSourceIntrospector } from '../introspection/base';
import { DatabricksIntrospector } from '../introspection/databricks';
import { type Credentials, DataSourceType, type DatabricksCredentials } from '../types/credentials';
import type { QueryParameter } from '../types/query';
import { type AdapterQueryResult, BaseAdapter, type FieldMetadata } from './base';

/**
 * Databricks database adapter
 */
export class DatabricksAdapter extends BaseAdapter {
  private client?: DBSQLClient;
  private session?: IDBSQLSession;
  private introspector?: DatabricksIntrospector;

  async initialize(credentials: Credentials): Promise<void> {
    this.validateCredentials(credentials, DataSourceType.Databricks);
    const databricksCredentials = credentials as DatabricksCredentials;

    try {
      this.client = new DBSQLClient();

      const connectOptions = {
        host: databricksCredentials.server_hostname,
        path: databricksCredentials.http_path,
        token: databricksCredentials.access_token,
      };

      await this.client.connect(connectOptions);
      this.session = await this.client.openSession({
        initialCatalog: databricksCredentials.catalog,
        initialSchema: databricksCredentials.schema,
      });

      this.credentials = credentials;
      this.connected = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Databricks client: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async query(sql: string, params?: QueryParameter[]): Promise<AdapterQueryResult> {
    this.ensureConnected();

    if (!this.session) {
      throw new Error('Databricks session not initialized');
    }

    try {
      // Databricks SQL driver doesn't support parameterized queries in the same way
      // For now, we'll execute the query as-is and log a warning if params are provided
      if (params && params.length > 0) {
        console.warn(
          'Databricks adapter: Parameterized queries not fully supported. Consider using string interpolation carefully.'
        );
      }

      const queryOperation: IOperation = await this.session.executeStatement(sql, {
        runAsync: true,
        maxRows: 10000, // Enable direct results feature
      });

      const result = await queryOperation.fetchAll();
      await queryOperation.close();

      // Convert result to proper format
      const resultRows: Record<string, unknown>[] = (result || []) as Record<string, unknown>[];

      // Databricks doesn't provide detailed field metadata in the same format
      const fields: FieldMetadata[] = [];

      return {
        rows: resultRows,
        rowCount: resultRows.length,
        fields,
      };
    } catch (error) {
      throw new Error(
        `Databricks query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.session) {
        return false;
      }

      // Test connection by running a simple query
      const queryOperation: IOperation = await this.session.executeStatement('SELECT 1 as test', {
        runAsync: true,
        maxRows: 1,
      });

      await queryOperation.fetchAll();
      await queryOperation.close();
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.session) {
        await this.session.close();
        this.session = undefined;
      }

      if (this.client) {
        await this.client.close();
        this.client = undefined;
      }
    } catch (error) {
      console.warn(
        `Error closing Databricks connection: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    this.connected = false;
  }

  getDataSourceType(): string {
    return DataSourceType.Databricks;
  }

  introspect(): DataSourceIntrospector {
    if (!this.introspector) {
      this.introspector = new DatabricksIntrospector('databricks', this);
    }
    return this.introspector;
  }
}
