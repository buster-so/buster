import { describe, expect, it, vi } from 'vitest';
import { BigQueryAdapter } from '../adapters/bigquery';

vi.mock('@google-cloud/bigquery');

describe('BigQueryAdapter Cancellation', () => {
  it('should create cancellable query', () => {
    const adapter = new BigQueryAdapter();
    const mockClient = {
      createQueryJob: vi.fn(),
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
    const adapter = new BigQueryAdapter();
    expect(adapter.isQueryCancellable()).toBe(true);
  });
});
