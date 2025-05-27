import sql from 'mssql';
import type { DataSourceIntrospector } from '../introspection/base';
import { SQLServerIntrospector } from '../introspection/sqlserver';
import { type Credentials, DataSourceType, type SQLServerCredentials } from '../types/credentials';
import type { QueryParameter } from '../types/query';
import { type AdapterQueryResult, BaseAdapter, type FieldMetadata } from './base';

/**
 * SQL Server database adapter
 */
export class SQLServerAdapter extends BaseAdapter {
  private pool?: sql.ConnectionPool;
  private introspector?: SQLServerIntrospector;

  async initialize(credentials: Credentials): Promise<void> {
    this.validateCredentials(credentials, DataSourceType.SQLServer);
    const sqlServerCredentials = credentials as SQLServerCredentials;

    try {
      const config: sql.config = {
        server: sqlServerCredentials.server,
        port: sqlServerCredentials.port,
        database: sqlServerCredentials.database,
        user: sqlServerCredentials.username,
        password: sqlServerCredentials.password,
        options: {
          encrypt: sqlServerCredentials.encrypt ?? true,
          trustServerCertificate: sqlServerCredentials.trust_server_certificate ?? false,
        },
      };

      // Handle domain authentication
      if (sqlServerCredentials.domain) {
        config.domain = sqlServerCredentials.domain;
      }

      // Handle instance name
      if (sqlServerCredentials.instance) {
        if (!config.options) {
          config.options = {};
        }
        config.options.instanceName = sqlServerCredentials.instance;
      }

      // Handle timeouts
      if (sqlServerCredentials.connection_timeout) {
        config.connectionTimeout = sqlServerCredentials.connection_timeout;
      }

      if (sqlServerCredentials.request_timeout) {
        config.requestTimeout = sqlServerCredentials.request_timeout;
      }

      this.pool = new sql.ConnectionPool(config);
      await this.pool.connect();

      this.credentials = credentials;
      this.connected = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize SQL Server client: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async query(sqlQuery: string, params?: QueryParameter[]): Promise<AdapterQueryResult> {
    this.ensureConnected();

    if (!this.pool) {
      throw new Error('SQL Server connection pool not initialized');
    }

    try {
      const request = this.pool.request();
      let processedQuery = sqlQuery;

      // Add parameters if provided
      if (params && params.length > 0) {
        params.forEach((param, index) => {
          request.input(`param${index}`, param);
        });

        // Replace ? placeholders with @param0, @param1, etc.
        let paramIndex = 0;
        processedQuery = sqlQuery.replace(/\?/g, () => `@param${paramIndex++}`);
      }

      const result = await request.query(processedQuery);

      const fields: FieldMetadata[] = result.recordset?.columns
        ? Object.keys(result.recordset.columns).map((name) => {
            const column = result.recordset?.columns?.[name];
            const columnType = typeof column?.type === 'function' ? column.type() : column?.type;

            // Type the column type properly instead of using unknown
            const typedColumnType = columnType as { name?: string } | undefined;

            return {
              name,
              type: typedColumnType?.name || 'unknown',
              length: column?.length,
              nullable: column?.nullable,
            };
          })
        : [];

      return {
        rows: result.recordset || [],
        rowCount: result.rowsAffected?.[0] || result.recordset?.length || 0,
        fields,
      };
    } catch (error) {
      throw new Error(
        `SQL Server query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.pool) {
        return false;
      }

      // Test connection by running a simple query
      const request = this.pool.request();
      await request.query('SELECT 1 as test');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = undefined;
    }
    this.connected = false;
  }

  getDataSourceType(): string {
    return DataSourceType.SQLServer;
  }

  introspect(): DataSourceIntrospector {
    if (!this.introspector) {
      this.introspector = new SQLServerIntrospector('sqlserver', this);
    }
    return this.introspector;
  }
}
