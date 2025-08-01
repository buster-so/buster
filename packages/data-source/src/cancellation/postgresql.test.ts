import { describe, expect, it, vi } from 'vitest';
import { PostgreSQLAdapter } from '../adapters/postgresql';

vi.mock('pg');

describe('PostgreSQLAdapter Cancellation', () => {
  it('should create cancellable query', () => {
    const adapter = new PostgreSQLAdapter();
    const mockClient = {
      query: vi.fn(),
      connect: vi.fn(),
      end: vi.fn(),
    };

    (adapter as any).client = mockClient;
    (adapter as any).connected = true;

    const cancellableQuery = adapter.createCancellableQuery('SELECT 1');
    expect(cancellableQuery).toBeDefined();
    expect(typeof cancellableQuery.cancel).toBe('function');
    expect(typeof cancellableQuery.execute).toBe('function');
    expect(typeof cancellableQuery.onTimeout).toBe('function');
  });

  it('should report as cancellable', () => {
    const adapter = new PostgreSQLAdapter();
    expect(adapter.isQueryCancellable()).toBe(true);
  });
});
