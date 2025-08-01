import { describe, expect, it, vi } from 'vitest';
import { SQLServerAdapter } from '../adapters/sqlserver';

vi.mock('mssql');

describe('SQLServerAdapter Cancellation', () => {
  it('should create cancellable query', () => {
    const adapter = new SQLServerAdapter();
    const mockPool = {
      request: vi.fn(),
      connect: vi.fn(),
      close: vi.fn(),
    };

    (adapter as any).pool = mockPool;
    (adapter as any).connected = true;

    const cancellableQuery = adapter.createCancellableQuery('SELECT 1');
    expect(cancellableQuery).toBeDefined();
    expect(typeof cancellableQuery.cancel).toBe('function');
    expect(typeof cancellableQuery.execute).toBe('function');
    expect(typeof cancellableQuery.onTimeout).toBe('function');
  });

  it('should report as cancellable', () => {
    const adapter = new SQLServerAdapter();
    expect(adapter.isQueryCancellable()).toBe(true);
  });
});
