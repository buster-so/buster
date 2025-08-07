import { describe, expect, it, vi } from 'vitest';
import { SnowflakeAdapter } from '../adapters/snowflake';
import { QueryCancellationError } from '../errors/data-source-errors';
import type { SnowflakeCredentials } from '../types/credentials';

vi.mock('snowflake-sdk');

describe('SnowflakeAdapter Cancellation', () => {
  it('should create cancellable query', () => {
    const adapter = new SnowflakeAdapter();
    const mockConnection = {
      execute: vi.fn(),
    };

    (adapter as any).connection = mockConnection;
    (adapter as any).connected = true;

    const cancellableQuery = adapter.createCancellableQuery('SELECT 1');
    expect(cancellableQuery).toBeDefined();
    expect(typeof cancellableQuery.cancel).toBe('function');
    expect(typeof cancellableQuery.execute).toBe('function');
    expect(typeof cancellableQuery.onTimeout).toBe('function');
  });

  it('should report as cancellable', () => {
    const adapter = new SnowflakeAdapter();
    expect(adapter.isQueryCancellable()).toBe(true);
  });

  it('should handle cancel by ID with warning', async () => {
    const adapter = new SnowflakeAdapter();
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await adapter.cancelQuery('test-id');

    expect(consoleSpy).toHaveBeenCalledWith(
      'Snowflake cancelQuery by ID not implemented - use CancellableQuery instead'
    );

    consoleSpy.mockRestore();
  });
});
