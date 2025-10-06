import { describe, expect, it } from 'vitest';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { getChangedTopLevelMessageValues } from './saveToServerHelpers';

// Mock minimal metric objects for testing
const createMockMetric = (overrides?: Partial<BusterMetric>): BusterMetric =>
  ({
    id: '123',
    name: 'Test Metric',
    status: 'notRequested',
    sql: 'SELECT * FROM test',
    file: 'test.yaml',
    // Add other required properties with default values
    // These won't affect the tests for getChangedTopLevelMessageValues
    type: 'metric_file',
    version_number: 1,
    description: null,
    file_name: 'test.yaml',
    time_frame: 'daily',
    dataset_id: 'ds123',
    data_source_id: 'src123',
    dataset_name: null,
    error: null,
    data_metadata: null,
    evaluation_score: 'Moderate',
    evaluation_summary: '',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    sent_by_id: 'user123',
    sent_by_name: 'Test User',
    sent_by_avatar_url: null,
    dashboards: [],
    collections: [],
    versions: [],
    ...overrides,
  }) as BusterMetric;

describe('getChangedTopLevelMessageValues', () => {
  it('should return empty object when no values have changed', () => {
    const oldMetric = createMockMetric();
    const newMetric = createMockMetric();

    const result = getChangedTopLevelMessageValues(newMetric, oldMetric);

    expect(result).toEqual({});
  });

  it('should detect changes in name property', () => {
    const oldMetric = createMockMetric();
    const newMetric = createMockMetric({ name: 'Updated Metric Name' });

    const result = getChangedTopLevelMessageValues(newMetric, oldMetric);

    expect(result).toEqual({ name: 'Updated Metric Name' });
  });

  it('should detect changes in status property', () => {
    const oldMetric = createMockMetric();
    const newMetric = createMockMetric({ status: 'verified' });

    const result = getChangedTopLevelMessageValues(newMetric, oldMetric);

    expect(result).toEqual({ status: 'verified' });
  });

  it('should detect changes in sql property', () => {
    const oldMetric = createMockMetric();
    const newMetric = createMockMetric({ sql: 'SELECT count(*) FROM users' });

    const result = getChangedTopLevelMessageValues(newMetric, oldMetric);

    expect(result).toEqual({ sql: 'SELECT count(*) FROM users' });
  });

  it('should detect changes in file property', () => {
    const oldMetric = createMockMetric();
    const newMetric = createMockMetric({ file: 'updated.yaml' });

    const result = getChangedTopLevelMessageValues(newMetric, oldMetric);

    expect(result).toEqual({ file: 'updated.yaml' });
  });

  it('should detect multiple property changes at once', () => {
    const oldMetric = createMockMetric();
    const newMetric = createMockMetric({
      name: 'Updated Name',
      status: 'verified',
      sql: 'SELECT count(*) FROM orders',
    });

    const result = getChangedTopLevelMessageValues(newMetric, oldMetric);

    expect(result).toEqual({
      name: 'Updated Name',
      status: 'verified',
      sql: 'SELECT count(*) FROM orders',
    });
  });

  it('should not include properties that are not in the tracked list', () => {
    const oldMetric = createMockMetric();
    const newMetric = createMockMetric({
      name: 'Updated Name',
      description: 'Updated description', // Not in tracked properties
    });

    const result = getChangedTopLevelMessageValues(newMetric, oldMetric);

    expect(result).toEqual({
      name: 'Updated Name',
    });

    // Verify properties not being tracked aren't included
    expect(result).not.toHaveProperty('description');
    expect(result).not.toHaveProperty('dataset_name');
  });

  it('should handle null to non-null value changes', () => {
    const oldMetric = createMockMetric({ sql: null });
    const newMetric = createMockMetric({ sql: 'SELECT * FROM users' });

    const result = getChangedTopLevelMessageValues(newMetric, oldMetric);

    expect(result).toEqual({ sql: 'SELECT * FROM users' });
  });

  it('should handle non-null to null value changes', () => {
    const oldMetric = createMockMetric({ sql: 'SELECT * FROM users' });
    const newMetric = createMockMetric({ sql: null });

    const result = getChangedTopLevelMessageValues(newMetric, oldMetric);

    expect(result).toEqual({ sql: null });
  });

  it('shoudl handle a name change', () => {
    const oldMetric = createMockMetric();
    const newMetric = createMockMetric({ name: 'Updated Metric Name is a good name' });

    const result = getChangedTopLevelMessageValues(newMetric, oldMetric);

    expect(result).toEqual({ name: 'Updated Metric Name is a good name' });
  });
});
