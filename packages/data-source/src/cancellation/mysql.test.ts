import { describe, expect, it, vi } from 'vitest';
import { MySQLAdapter } from '../adapters/mysql';

vi.mock('mysql2/promise');

describe('MySQLAdapter Cancellation', () => {
  it('should create cancellable query', () => {
    const adapter = new MySQLAdapter();
    (adapter as any).connected = true;
    (adapter as any).credentials = {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      database: 'test',
      username: 'test',
      password: 'test',
    };

    const cancellableQuery = adapter.createCancellableQuery('SELECT 1');
    expect(cancellableQuery).toBeDefined();
    expect(typeof cancellableQuery.cancel).toBe('function');
    expect(typeof cancellableQuery.execute).toBe('function');
    expect(typeof cancellableQuery.onTimeout).toBe('function');
  });

  it('should report as cancellable', () => {
    const adapter = new MySQLAdapter();
    expect(adapter.isQueryCancellable()).toBe(true);
  });
});
