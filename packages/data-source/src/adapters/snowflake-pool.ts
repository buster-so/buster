import snowflake from 'snowflake-sdk';
import {
  ConnectionAcquisitionTimeoutError,
  ConnectionPoolError,
  ConnectionPoolExhaustedError,
  NetworkError,
} from '../errors/data-source-errors';
import type { SnowflakeCredentials } from '../types/credentials';

// Use Snowflake SDK types directly
type SnowflakeError = snowflake.SnowflakeError;

interface PooledConnection {
  connection: snowflake.Connection;
  inUse: boolean;
  lastUsed: number;
  id: string;
}

interface PoolOptions {
  minConnections: number;
  maxConnections: number;
  idleTimeout: number; // ms
  acquireTimeout: number; // ms
  connectionTimeout: number; // ms
}

export class SnowflakeConnectionPool {
  private connections: Map<string, PooledConnection> = new Map();
  private credentials: SnowflakeCredentials;
  private options: PoolOptions;
  private waitingQueue: Array<{
    resolve: (conn: snowflake.Connection) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = [];
  private healthCheckInterval?: NodeJS.Timeout;
  private closed = false;

  constructor(credentials: SnowflakeCredentials, options?: Partial<PoolOptions>) {
    this.credentials = credentials;
    this.options = {
      minConnections: 2,
      maxConnections: 10,
      idleTimeout: 300000, // 5 minutes
      acquireTimeout: 30000, // 30 seconds
      connectionTimeout: 60000, // 60 seconds
      ...options,
    };

    // Start health check
    this.startHealthCheck();
  }

  private async createConnection(): Promise<snowflake.Connection> {
    const connectionOptions: snowflake.ConnectionOptions = {
      account: this.credentials.account_id,
      username: this.credentials.username,
      password: this.credentials.password,
      warehouse: this.credentials.warehouse_id,
      database: this.credentials.default_database,
    };

    if (this.credentials.role) {
      connectionOptions.role = this.credentials.role;
    }

    if (this.credentials.default_schema) {
      connectionOptions.schema = this.credentials.default_schema;
    }

    const connection = snowflake.createConnection(connectionOptions);

    // Connect with timeout
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new ConnectionAcquisitionTimeoutError(this.options.connectionTimeout));
      }, this.options.connectionTimeout);

      connection.connect((err) => {
        clearTimeout(timeout);
        if (err) {
          reject(new NetworkError(`Failed to connect to Snowflake: ${err.message}`, err));
        } else {
          resolve(connection);
        }
      });
    });
  }

  async initialize(): Promise<void> {
    // Create minimum connections
    const promises: Promise<void>[] = [];
    for (let i = 0; i < this.options.minConnections; i++) {
      promises.push(this.addConnection());
    }
    await Promise.all(promises);
  }

  private async addConnection(): Promise<void> {
    if (this.connections.size >= this.options.maxConnections) {
      throw new ConnectionPoolExhaustedError(this.options.maxConnections);
    }

    try {
      const connection = await this.createConnection();
      const id = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      this.connections.set(id, {
        connection,
        inUse: false,
        lastUsed: Date.now(),
        id,
      });
    } catch (error) {
      console.error('Failed to create connection:', error);
      throw error;
    }
  }

  async acquire(): Promise<snowflake.Connection> {
    if (this.closed) {
      throw new ConnectionPoolError('Connection pool is closed');
    }

    // Try to find an available connection
    for (const [id, pooled] of this.connections) {
      if (!pooled.inUse) {
        pooled.inUse = true;
        pooled.lastUsed = Date.now();

        // Test connection health
        if (await this.isConnectionHealthy(pooled.connection)) {
          return pooled.connection;
        }

        // Remove unhealthy connection
        this.connections.delete(id);
        await this.destroyConnection(pooled.connection);
      }
    }

    // If no available connections and we can create more
    if (this.connections.size < this.options.maxConnections) {
      try {
        await this.addConnection();
        return this.acquire(); // Recursive call to get the newly created connection
      } catch {
        // Fall through to waiting queue
      }
    }

    // Wait for a connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex((item) => item.timeout === timeout);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new ConnectionAcquisitionTimeoutError(this.options.acquireTimeout));
      }, this.options.acquireTimeout);

      this.waitingQueue.push({ resolve, reject, timeout });
    });
  }

  release(connection: snowflake.Connection): void {
    // Find the connection in the pool
    for (const pooled of this.connections.values()) {
      if (pooled.connection === connection) {
        pooled.inUse = false;
        pooled.lastUsed = Date.now();

        // Process waiting queue
        if (this.waitingQueue.length > 0) {
          const waiting = this.waitingQueue.shift();
          if (waiting) {
            clearTimeout(waiting.timeout);
            pooled.inUse = true;
            waiting.resolve(connection);
          }
        }
        return;
      }
    }

    // Connection not found in pool - destroy it
    console.warn('Released connection not found in pool');
    this.destroyConnection(connection).catch(console.error);
  }

  private async isConnectionHealthy(connection: snowflake.Connection): Promise<boolean> {
    try {
      return new Promise((resolve) => {
        connection.execute({
          sqlText: 'SELECT 1',
          complete: (err: SnowflakeError | undefined) => {
            resolve(!err);
          },
        });
      });
    } catch {
      return false;
    }
  }

  private async destroyConnection(connection: snowflake.Connection): Promise<void> {
    return new Promise((resolve) => {
      connection.destroy((err: SnowflakeError | undefined) => {
        if (err) {
          console.error('Error destroying connection:', err);
        }
        resolve();
      });
    });
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck().catch(console.error);
    }, 60000); // Check every minute
  }

  private async performHealthCheck(): Promise<void> {
    const now = Date.now();
    const connectionsToRemove: string[] = [];

    for (const [id, pooled] of this.connections) {
      // Remove idle connections
      if (!pooled.inUse && now - pooled.lastUsed > this.options.idleTimeout) {
        connectionsToRemove.push(id);
      }
    }

    // Remove idle connections
    for (const id of connectionsToRemove) {
      const pooled = this.connections.get(id);
      if (pooled && !pooled.inUse) {
        this.connections.delete(id);
        await this.destroyConnection(pooled.connection);
      }
    }

    // Ensure minimum connections
    while (this.connections.size < this.options.minConnections && !this.closed) {
      try {
        await this.addConnection();
      } catch (error) {
        console.error('Failed to maintain minimum connections:', error);
        break;
      }
    }
  }

  async close(): Promise<void> {
    this.closed = true;

    // Clear health check
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Reject all waiting requests
    for (const waiting of this.waitingQueue) {
      clearTimeout(waiting.timeout);
      waiting.reject(new Error('Connection pool is closing'));
    }
    this.waitingQueue = [];

    // Close all connections
    const promises: Promise<void>[] = [];
    for (const pooled of this.connections.values()) {
      promises.push(this.destroyConnection(pooled.connection));
    }
    await Promise.all(promises);

    this.connections.clear();
  }

  getStats() {
    const inUse = Array.from(this.connections.values()).filter((c) => c.inUse).length;
    return {
      total: this.connections.size,
      inUse,
      available: this.connections.size - inUse,
      waiting: this.waitingQueue.length,
    };
  }
}
