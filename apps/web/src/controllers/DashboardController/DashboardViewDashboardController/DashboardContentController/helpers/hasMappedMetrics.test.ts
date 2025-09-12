import type { DashboardConfig } from '@buster/server-shared/dashboards';
import { describe, expect, it } from 'vitest';
import { NUMBER_OF_COLUMNS } from '@/components/ui/grid/helpers';
import { createMockMetric } from '@/mocks/metric';
import { hasRemovedMetrics, hasUnmappedMetrics } from './hasMappedMetrics';

const createMockRow = (
  itemIds: string[],
  rowId?: number
): NonNullable<DashboardConfig['rows']>[0] => ({
  id: rowId ?? 1,
  columnSizes: Array(itemIds.length).fill(NUMBER_OF_COLUMNS / itemIds.length),
  items: itemIds.map((id) => ({ id })),
});

describe('hasUnmappedMetrics', () => {
  const mockMetric1 = createMockMetric('1');
  const mockMetric2 = createMockMetric('2');
  const mockMetric3 = createMockMetric('3');

  it('should return false when all metrics are mapped', () => {
    const metrics = {
      '1': mockMetric1,
      '2': mockMetric2,
      '3': mockMetric3,
    };

    const configRows: DashboardConfig['rows'] = [
      createMockRow(['1', '2'], 1),
      createMockRow(['3'], 2),
    ];

    expect(hasUnmappedMetrics(metrics, configRows)).toBe(false);
  });

  it('should return true when there are unmapped metrics', () => {
    const metrics = {
      '1': mockMetric1,
      '2': mockMetric2,
      '3': mockMetric3,
    };

    const configRows: DashboardConfig['rows'] = [createMockRow(['1'])];

    expect(hasUnmappedMetrics(metrics, configRows)).toBe(true);
  });

  it('should return true when configRows is empty', () => {
    const metrics = {
      '1': mockMetric1,
      '2': mockMetric2,
    };

    expect(hasUnmappedMetrics(metrics, [])).toBe(true);
  });

  it('should return false when metrics object is empty', () => {
    const metrics = {};
    const configRows: DashboardConfig['rows'] = [createMockRow(['1'])];

    expect(hasUnmappedMetrics(metrics, configRows)).toBe(false);
  });
});

describe('hasRemovedMetrics', () => {
  const mockMetric1 = createMockMetric('1');
  const mockMetric2 = createMockMetric('2');
  const mockMetric3 = createMockMetric('3');

  it('should return false when all metrics are present in grid rows', () => {
    const metrics = {
      '1': mockMetric1,
      '2': mockMetric2,
      '3': mockMetric3,
    };

    const configRows = [createMockRow(['1', '2'], 1), createMockRow(['3'], 2)];

    expect(hasRemovedMetrics(metrics, configRows)).toBe(false);
  });

  it('should return true when there are more grid items than metrics', () => {
    const metrics = {
      '1': mockMetric1,
      '2': mockMetric2,
    };

    const configRows = [createMockRow(['1', '2', '3'])];

    expect(hasRemovedMetrics(metrics, configRows)).toBe(true);
  });

  it('should return true when there are fewer grid items than metrics', () => {
    const metrics = {
      '1': mockMetric1,
      '2': mockMetric2,
      '3': mockMetric3,
    };

    const configRows = [createMockRow(['1', '2'])];

    expect(hasRemovedMetrics(metrics, configRows)).toBe(true);
  });

  it('should return true when grid items have different IDs than metrics', () => {
    const metrics = {
      '1': mockMetric1,
      '2': mockMetric2,
    };

    const configRows = [createMockRow(['3', '4'])];

    expect(hasRemovedMetrics(metrics, configRows)).toBe(true);
  });

  it('should return false when both metrics and grid rows are empty', () => {
    const metrics = {};
    const configRows: NonNullable<DashboardConfig['rows']> = [];

    expect(hasRemovedMetrics(metrics, configRows)).toBe(false);
  });
});
