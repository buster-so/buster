import { describe, expect, it, vi } from 'vitest';
import { RedshiftAdapter } from '../adapters/redshift';

vi.mock('pg');

describe('RedshiftAdapter Cancellation', () => {
  it('should create cancellable query', () => {
    const adapter = new RedshiftAdapter();
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
    const adapter = new RedshiftAdapter();
    expect(adapter.isQueryCancellable()).toBe(true);
  });
});
