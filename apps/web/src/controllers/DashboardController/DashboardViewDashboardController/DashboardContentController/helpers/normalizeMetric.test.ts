import type { DashboardConfig } from '@buster/server-shared/dashboards';
import { describe, expect, it } from 'vitest';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import {
  MAX_NUMBER_OF_ITEMS,
  MIN_ROW_HEIGHT,
  NUMBER_OF_COLUMNS,
} from '@/components/ui/grid/helpers';
import { createMockMetric } from '@/mocks/metric';
import { normalizeNewMetricsIntoGrid } from './normalizeMetric';

describe('normalizeNewMetricsIntoGrid', () => {
  const mockMetric = (id: string): BusterMetric => createMockMetric(id);

  const createMockRow = (
    itemIds: string[],
    rowId?: number
  ): NonNullable<DashboardConfig['rows']>[0] => ({
    id: rowId ?? 1,
    columnSizes: Array(itemIds.length).fill(NUMBER_OF_COLUMNS / itemIds.length),
    rowHeight: MIN_ROW_HEIGHT,
    items: itemIds.map((id) => ({ id })),
  });

  it('should create a new grid when no existing grid is provided', () => {
    const metrics = {
      '1': mockMetric('1'),
      '2': mockMetric('2'),
      '3': mockMetric('3'),
      '4': mockMetric('4'),
    };

    const result = normalizeNewMetricsIntoGrid(metrics);

    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(4);
    expect(result[0].columnSizes).toEqual([
      NUMBER_OF_COLUMNS / 4,
      NUMBER_OF_COLUMNS / 4,
      NUMBER_OF_COLUMNS / 4,
      NUMBER_OF_COLUMNS / 4,
    ]);
  });

  it('should add new metrics to existing grid when there is space in the first row', () => {
    const existingGrid: DashboardConfig['rows'] = [createMockRow(['1', '2'])];

    const metrics = {
      '1': mockMetric('1'),
      '2': mockMetric('2'),
      '3': mockMetric('3'),
      '4': mockMetric('4'),
    };

    const result = normalizeNewMetricsIntoGrid(metrics, existingGrid);

    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(4);
    expect(result[0].columnSizes).toEqual([
      NUMBER_OF_COLUMNS / 4,
      NUMBER_OF_COLUMNS / 4,
      NUMBER_OF_COLUMNS / 4,
      NUMBER_OF_COLUMNS / 4,
    ]);
  });

  it('should create new rows when adding metrics beyond first row capacity', () => {
    const existingGrid: DashboardConfig['rows'] = [createMockRow(['1', '2', '3', '4'])];

    const metrics = {
      '1': mockMetric('1'),
      '2': mockMetric('2'),
      '3': mockMetric('3'),
      '4': mockMetric('4'),
      '5': mockMetric('5'),
      '6': mockMetric('6'),
      '7': mockMetric('7'),
      '8': mockMetric('8'),
    };

    const result = normalizeNewMetricsIntoGrid(metrics, existingGrid);

    expect(result).toHaveLength(2);
    expect(result[0].items).toHaveLength(4);
    expect(result[1].items).toHaveLength(4);
  });

  it('should remove metrics that are no longer present', () => {
    const existingGrid: DashboardConfig['rows'] = [createMockRow(['1', '2', '3', '4'])];

    const metrics = {
      '1': mockMetric('1'),
      '2': mockMetric('2'),
    };

    const result = normalizeNewMetricsIntoGrid(metrics, existingGrid);

    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(2);
    expect(result[0].items.map((item) => item.id)).toEqual(['1', '2']);
  });

  it('should handle both adding and removing metrics simultaneously - should also handle deduplication', () => {
    const existingGrid: DashboardConfig['rows'] = [createMockRow(['1', '2'])];

    const metrics = {
      '2': mockMetric('2'),
      '3': mockMetric('3'),
      '4': mockMetric('4'),
    };

    const result = normalizeNewMetricsIntoGrid(metrics, existingGrid);

    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(3);
    expect(result[0].items.map((item) => item.id)).toEqual(['2', '3', '4']);
  });

  it('should remove empty rows after removing metrics', () => {
    const existingGrid: DashboardConfig['rows'] = [
      createMockRow(['1', '2'], 1),
      createMockRow(['3', '4'], 2),
    ];

    const metrics = {
      '1': mockMetric('1'),
      '2': mockMetric('2'),
    };

    const result = normalizeNewMetricsIntoGrid(metrics, existingGrid);

    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(2);
  });

  it('should handle empty metrics object', () => {
    const existingGrid: DashboardConfig['rows'] = [createMockRow(['1', '2', '3', '4'])];
    const metrics = {};
    const result = normalizeNewMetricsIntoGrid(metrics, existingGrid);
    expect(result).toHaveLength(0);
  });

  it('should maintain row height when adding new metrics', () => {
    const customRowHeight = MIN_ROW_HEIGHT * 2;
    const existingGrid: DashboardConfig['rows'] = [
      {
        ...createMockRow(['1', '2']),
        rowHeight: customRowHeight,
      },
    ];

    const metrics = {
      '1': mockMetric('1'),
      '2': mockMetric('2'),
      '3': mockMetric('3'),
      '4': mockMetric('4'),
    };

    const result = normalizeNewMetricsIntoGrid(metrics, existingGrid);
    expect(result[0].rowHeight).toBe(customRowHeight);
  });

  it('should handle metrics exceeding MAX_NUMBER_OF_ITEMS by creating new rows', () => {
    const metrics = Array.from({ length: MAX_NUMBER_OF_ITEMS + 3 }, (_, i) => ({
      [i.toString()]: mockMetric(i.toString()),
      // biome-ignore lint/performance/noAccumulatingSpread: this is a test and it's not performance critical
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {});

    const result = normalizeNewMetricsIntoGrid(metrics);
    expect(result.length).toBeGreaterThan(1);
    expect(result[0].items.length).toBeLessThanOrEqual(MAX_NUMBER_OF_ITEMS);
  });

  it('should handle metrics with non-sequential IDs', () => {
    const metrics = {
      abc123: mockMetric('abc123'),
      xyz789: mockMetric('xyz789'),
      def456: mockMetric('def456'),
      uvw321: mockMetric('uvw321'),
    };

    const result = normalizeNewMetricsIntoGrid(metrics);
    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(4);
    expect(result[0].items.map((item) => item.id)).toEqual([
      'abc123',
      'xyz789',
      'def456',
      'uvw321',
    ]);
  });

  it('should preserve column sizes when reordering metrics', () => {
    const existingGrid: DashboardConfig['rows'] = [
      {
        ...createMockRow(['1', '2', '3']),
        columnSizes: [NUMBER_OF_COLUMNS / 2, NUMBER_OF_COLUMNS / 4, NUMBER_OF_COLUMNS / 4],
      },
    ];

    const metrics = {
      '2': mockMetric('2'),
      '1': mockMetric('1'),
      '3': mockMetric('3'),
    };

    const result = normalizeNewMetricsIntoGrid(metrics, existingGrid);
    expect(result[0].columnSizes).toEqual([
      NUMBER_OF_COLUMNS / 2,
      NUMBER_OF_COLUMNS / 4,
      NUMBER_OF_COLUMNS / 4,
    ]);
  });

  it('should handle single metric with maximum width', () => {
    const metrics = {
      '1': mockMetric('1'),
    };

    const result = normalizeNewMetricsIntoGrid(metrics);
    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(1);
    expect(result[0].columnSizes).toEqual([NUMBER_OF_COLUMNS]);
  });

  it('should handle exactly 5 items in a row with equal column sizes', () => {
    const existingGrid: DashboardConfig['rows'] = [createMockRow(['1', '2', '3', '4'])];
    const metrics = {
      '1': mockMetric('1'),
      '2': mockMetric('2'),
      '3': mockMetric('3'),
      '4': mockMetric('4'),
      '5': mockMetric('5'),
    };

    const result = normalizeNewMetricsIntoGrid(metrics, existingGrid);
    expect(result).toHaveLength(2);
    expect(result[0].items).toHaveLength(1);
    expect(result[1].items).toHaveLength(4);
    expect(result[0].columnSizes).toEqual([NUMBER_OF_COLUMNS]);
    expect(result[1].columnSizes).toEqual([
      NUMBER_OF_COLUMNS / 4,
      NUMBER_OF_COLUMNS / 4,
      NUMBER_OF_COLUMNS / 4,
      NUMBER_OF_COLUMNS / 4,
    ]);
  });
});
