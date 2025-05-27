import { beforeEach, describe, expect, it } from 'vitest';
import { BaseAdapter } from '../../../src/adapters/base';
import type { AdapterQueryResult } from '../../../src/adapters/base';
import { DataSourceType } from '../../../src/types/credentials';
import type { Credentials, PostgreSQLCredentials } from '../../../src/types/credentials';

// Mock implementation of BaseAdapter for testing
class MockAdapter extends BaseAdapter {
  async initialize(credentials: Credentials): Promise<void> {
    this.validateCredentials(credentials, DataSourceType.PostgreSQL);
    this.credentials = credentials;
    this.connected = true;
  }

  async query(_sql: string, _params?: any[]): Promise<AdapterQueryResult> {
    this.ensureConnected();
    return {
      rows: [{ test: 1 }],
      rowCount: 1,
      fields: [{ name: 'test', type: 'integer' }],
    };
  }

  async testConnection(): Promise<boolean> {
    return this.connected;
  }

  async close(): Promise<void> {
    this.connected = false;
  }

  getDataSourceType(): string {
    return DataSourceType.PostgreSQL;
  }

  // Public methods to test protected properties
  public isConnected(): boolean {
    return this.connected;
  }

  public getCredentials(): Credentials | undefined {
    return this.credentials;
  }

  public testEnsureConnected(): void {
    this.ensureConnected();
  }
}

describe('BaseAdapter', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter();
  });

  describe('initialization', () => {
    it('should initialize with valid credentials', async () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      await adapter.initialize(credentials);
      expect(adapter.isConnected()).toBe(true);
      expect(adapter.getCredentials()).toEqual(credentials);
    });

    it('should throw error with invalid credentials type', async () => {
      const credentials = {
        type: DataSourceType.MySQL,
        host: 'localhost',
        port: 3306,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      await expect(adapter.initialize(credentials as any)).rejects.toThrow(
        'Invalid credentials type. Expected postgresql, got mysql'
      );
    });
  });

  describe('connection management', () => {
    it('should throw error when querying without connection', async () => {
      expect(() => adapter.testEnsureConnected()).toThrow(
        'postgresql adapter is not connected. Call initialize() first.'
      );
    });

    it('should allow queries after initialization', async () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      await adapter.initialize(credentials);
      const result = await adapter.query('SELECT 1');

      expect(result).toEqual({
        rows: [{ test: 1 }],
        rowCount: 1,
        fields: [{ name: 'test', type: 'integer' }],
      });
    });

    it('should test connection status', async () => {
      expect(await adapter.testConnection()).toBe(false);

      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      await adapter.initialize(credentials);
      expect(await adapter.testConnection()).toBe(true);
    });

    it('should close connection', async () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      await adapter.initialize(credentials);
      expect(adapter.isConnected()).toBe(true);

      await adapter.close();
      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('data source type', () => {
    it('should return correct data source type', () => {
      expect(adapter.getDataSourceType()).toBe(DataSourceType.PostgreSQL);
    });
  });
});
