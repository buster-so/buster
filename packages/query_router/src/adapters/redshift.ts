import { Client, type ClientConfig } from 'pg';
import { type Credentials, DataSourceType, type RedshiftCredentials } from '../types/credentials';
import type { QueryParameter } from '../types/query';
import { type AdapterQueryResult, BaseAdapter, type FieldMetadata } from './base';

/**
 * Redshift database adapter (PostgreSQL-compatible)
 */
export class RedshiftAdapter extends BaseAdapter {
  private client?: Client;

  async initialize(credentials: Credentials): Promise<void> {
    this.validateCredentials(credentials, DataSourceType.Redshift);
    const redshiftCredentials = credentials as RedshiftCredentials;

    try {
      const config: ClientConfig = {
        host: redshiftCredentials.host,
        port: redshiftCredentials.port || 5439, // Default Redshift port
        database: redshiftCredentials.database,
        user: redshiftCredentials.username,
        password: redshiftCredentials.password,
        ssl: redshiftCredentials.ssl ?? true, // SSL is typically required for Redshift
      };

      // Handle connection timeout
      if (redshiftCredentials.connection_timeout) {
        config.connectionTimeoutMillis = redshiftCredentials.connection_timeout;
      }

      // Set default schema if provided
      if (redshiftCredentials.schema) {
        config.options = `-c search_path=${redshiftCredentials.schema}`;
      }

      this.client = new Client(config);
      await this.client.connect();

      this.credentials = credentials;
      this.connected = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Redshift client: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async query(sql: string, params?: QueryParameter[]): Promise<AdapterQueryResult> {
    this.ensureConnected();

    if (!this.client) {
      throw new Error('Redshift client not initialized');
    }

    try {
      const result = await this.client.query(sql, params);

      const fields: FieldMetadata[] =
        result.fields?.map((field) => ({
          name: field.name,
          type: `redshift_type_${field.dataTypeID}`, // Redshift type ID
          nullable: true, // Redshift doesn't provide this info directly
          length: field.dataTypeSize > 0 ? field.dataTypeSize : undefined,
        })) || [];

      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        fields,
      };
    } catch (error) {
      throw new Error(
        `Redshift query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    return DataSourceType.Redshift;
  }
}
