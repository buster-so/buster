import type { DatabaseAdapter } from '../adapters/base';
import { DataSourceType } from '../types/credentials';
import type {
  Column,
  Database,
  Schema,
  Table,
  TableStatistics,
  View,
} from '../types/introspection';
import { BaseIntrospector } from './base';

/**
 * SQL Server-specific introspector implementation
 */
export class SQLServerIntrospector extends BaseIntrospector {
  constructor(dataSourceName: string, _adapter: DatabaseAdapter) {
    super(dataSourceName);
  }

  getDataSourceType(): string {
    return DataSourceType.SQLServer;
  }

  async getDatabases(): Promise<Database[]> {
    // Placeholder implementation
    return [
      {
        name: 'default_database',
        comment: 'SQL Server database (introspection not fully implemented)',
      },
    ];
  }

  async getSchemas(_database?: string): Promise<Schema[]> {
    // Placeholder implementation
    return [
      {
        name: 'dbo',
        database: 'default_database',
        comment: 'SQL Server schema (introspection not fully implemented)',
      },
    ];
  }

  async getTables(_database?: string, _schema?: string): Promise<Table[]> {
    // Placeholder implementation
    return [];
  }

  async getColumns(_database?: string, _schema?: string, _table?: string): Promise<Column[]> {
    // Placeholder implementation
    return [];
  }

  async getViews(_database?: string, _schema?: string): Promise<View[]> {
    // Placeholder implementation
    return [];
  }

  async getTableStatistics(
    _database: string,
    _schema: string,
    _table: string
  ): Promise<TableStatistics> {
    // Placeholder implementation
    return {
      table: _table,
      schema: _schema,
      database: _database,
      columnStatistics: [],
      lastUpdated: new Date(),
    };
  }
}
