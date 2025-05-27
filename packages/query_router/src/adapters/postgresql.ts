import { Client, type ClientConfig } from 'pg';
import { type Credentials, DataSourceType, type PostgreSQLCredentials } from '../types/credentials';
import type { QueryParameter } from '../types/query';
import { type AdapterQueryResult, BaseAdapter, type FieldMetadata } from './base';

/**
 * PostgreSQL database adapter
 */
export class PostgreSQLAdapter extends BaseAdapter {
  private client?: Client;

  async initialize(credentials: Credentials): Promise<void> {
    this.validateCredentials(credentials, DataSourceType.PostgreSQL);
    const pgCredentials = credentials as PostgreSQLCredentials;

    try {
      const config: ClientConfig = {
        host: pgCredentials.host,
        port: pgCredentials.port || 5432,
        database: pgCredentials.database,
        user: pgCredentials.username,
        password: pgCredentials.password,
      };

      // Handle SSL configuration
      if (pgCredentials.ssl !== undefined) {
        config.ssl = pgCredentials.ssl;
      }

      // Handle connection timeout
      if (pgCredentials.connection_timeout) {
        config.connectionTimeoutMillis = pgCredentials.connection_timeout;
      }

      // Set default schema if provided
      if (pgCredentials.schema) {
        config.options = `-c search_path=${pgCredentials.schema}`;
      }

      this.client = new Client(config);
      await this.client.connect();

      this.credentials = credentials;
      this.connected = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize PostgreSQL client: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async query(sql: string, params?: QueryParameter[]): Promise<AdapterQueryResult> {
    this.ensureConnected();

    if (!this.client) {
      throw new Error('PostgreSQL client not initialized');
    }

    try {
      const result = await this.client.query(sql, params);

      const fields: FieldMetadata[] =
        result.fields?.map((field) => ({
          name: field.name,
          type: `pg_type_${field.dataTypeID}`, // PostgreSQL type ID
          nullable: true, // PostgreSQL doesn't provide this info directly
          length: field.dataTypeSize > 0 ? field.dataTypeSize : undefined,
        })) || [];

      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        fields,
      };
    } catch (error) {
      throw new Error(
        `PostgreSQL query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      // Test connection by running a simple query
      await this.client.query('SELECT 1 as test');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = undefined;
    }
    this.connected = false;
  }

  getDataSourceType(): string {
    return DataSourceType.PostgreSQL;
  }
}
