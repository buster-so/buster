import { describe, expect, it } from 'vitest';
import type { IBusterMetric } from '@/api/asset_interfaces/metric';
import { ChartType } from '@/api/asset_interfaces/metric/charts';
import { VerificationStatus } from '@/api/asset_interfaces/share/verificationInterfaces';
import {
  getChangedTopLevelMessageValues,
  getChangesFromDefaultChartConfig
} from './saveToServerHelpers';

// Mock minimal metric objects for testing
const createMockMetric = (overrides?: Partial<IBusterMetric>): IBusterMetric =>
  ({
    id: '123',
    name: 'Test Metric',
    status: VerificationStatus.NOT_REQUESTED,
    sql: 'SELECT * FROM test',
    file: 'test.yaml',
    // Add other required properties with default values
    // These won't affect the tests for getChangedTopLevelMessageValues
    type: 'metric',
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
    ...overrides
  }) as IBusterMetric;

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
    const newMetric = createMockMetric({ status: VerificationStatus.VERIFIED });

    const result = getChangedTopLevelMessageValues(newMetric, oldMetric);

    expect(result).toEqual({ status: VerificationStatus.VERIFIED });
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
      status: VerificationStatus.VERIFIED,
      sql: 'SELECT count(*) FROM orders'
    });

    const result = getChangedTopLevelMessageValues(newMetric, oldMetric);

    expect(result).toEqual({
      name: 'Updated Name',
      status: VerificationStatus.VERIFIED,
      sql: 'SELECT count(*) FROM orders'
    });
  });

  it('should not include properties that are not in the tracked list', () => {
    const oldMetric = createMockMetric();
    const newMetric = createMockMetric({
      name: 'Updated Name',
      description: 'Updated description', // Not in tracked properties
      dataset_name: 'New Dataset' // Not in tracked properties
    });

    const result = getChangedTopLevelMessageValues(newMetric, oldMetric);

    expect(result).toEqual({
      name: 'Updated Name'
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

// Tests for getChangesFromDefaultChartConfig
describe('getChangesFromDefaultChartConfig', () => {
  it('should return empty object when chart_config is undefined', () => {
    const metric = createMockMetric({ chart_config: undefined });

    const result = getChangesFromDefaultChartConfig(metric);

    expect(result).toEqual({});
  });

  it('should detect changes from default chart config', () => {
    // Create a metric with partial chart config that will be merged with defaults
    const metric = createMockMetric();
    // Assert on a non-typed partial chart_config to avoid TypeScript errors
    // @ts-expect-error - We're testing runtime behavior, TypeScript doesn't need to validate this test data
    metric.chart_config = {
      selectedChartType: 'bar',
      showLegend: true,
      xAxisShowAxisLabel: false,
      colors: ['#FF0000', '#00FF00', '#0000FF'] // Custom colors
    };

    const result = getChangesFromDefaultChartConfig(metric);

    expect(result).toEqual({
      selectedChartType: 'bar',
      showLegend: true,
      xAxisShowAxisLabel: false,
      colors: ['#FF0000', '#00FF00', '#0000FF']
    });
  });

  it('should detect and filter changes in column label formats', () => {
    const metric = createMockMetric();

    // Create the chart config manually to avoid type issues
    const chartConfig = {} as any;
    chartConfig.columnLabelFormats = {
      revenue: {
        style: 'currency',
        currency: 'EUR',
        compactNumbers: true,
        makeLabelHumanReadable: true
      },
      date: {
        columnType: 'date',
        isUTC: true
      }
    };

    metric.chart_config = chartConfig;

    const result = getChangesFromDefaultChartConfig(metric);

    // Should only include the properties that differ from defaults
    expect(result).toEqual({
      columnLabelFormats: {
        revenue: {
          style: 'currency',
          currency: 'EUR',
          compactNumbers: true
        },
        date: {
          columnType: 'date',
          isUTC: true
        }
      }
    });
  });
});
