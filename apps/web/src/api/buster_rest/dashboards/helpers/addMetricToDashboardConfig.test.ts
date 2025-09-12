import { describe, expect, it } from 'vitest';
import type { BusterDashboard } from '@/api/asset_interfaces/dashboard';
import { addMetricToDashboardConfig } from './addMetricToDashboard';

describe('addMetricToDashboardConfig', () => {
  const createEmptyConfig = (): BusterDashboard['config'] => ({
    rows: [],
  });

  const createConfigWithRows = (
    rows: BusterDashboard['config']['rows']
  ): BusterDashboard['config'] => ({
    rows,
  });

  it('should return the same config if no new metrics are provided', () => {
    const config = createEmptyConfig();
    const result = addMetricToDashboardConfig([], config);
    expect(result).toBe(config);
  });

  it('should add a single metric to an empty config', () => {
    const config = createEmptyConfig();
    const result = addMetricToDashboardConfig(['metric1'], config);

    expect(result.rows).toHaveLength(1);
    expect(result.rows?.[0].items).toHaveLength(1);
    expect(result.rows?.[0].items?.[0].id).toBe('metric1');
    expect(result.rows?.[0].columnSizes).toEqual([12]); // Single column takes full width
  });

  it('should add multiple metrics up to MAX_NUMBER_OF_ITEMS in a single row', () => {
    const config = createEmptyConfig();
    const result = addMetricToDashboardConfig(['metric1', 'metric2', 'metric3', 'metric4'], config);

    expect(result.rows).toHaveLength(1);
    expect(result.rows?.[0].items).toHaveLength(4);
    expect(result.rows?.[0].columnSizes).toEqual([3, 3, 3, 3]); // 4 equal columns
  });

  it('should create multiple rows when metrics exceed MAX_NUMBER_OF_ITEMS', () => {
    const config = createEmptyConfig();
    const result = addMetricToDashboardConfig(
      ['metric1', 'metric2', 'metric3', 'metric4', 'metric5', 'metric6'],
      config
    );

    expect(result.rows).toHaveLength(2);
    expect(result.rows?.[0].items).toHaveLength(4);
    expect(result.rows?.[1].items).toHaveLength(2);
    expect(result.rows?.[0].columnSizes).toEqual([3, 3, 3, 3]);
    expect(result.rows?.[1].columnSizes).toEqual([6, 6]); // 2 equal columns
  });

  it('should not add duplicate metrics', () => {
    const config = createConfigWithRows([
      {
        id: 1,
        items: [{ id: 'metric1' }],
        columnSizes: [12],
        rowHeight: 320,
      },
    ]);

    const result = addMetricToDashboardConfig(['metric1', 'metric2'], config);

    expect(result.rows).toHaveLength(2);
    expect(result.rows?.[0].items).toHaveLength(1);
    expect(result.rows?.[1].items).toHaveLength(1);
    expect(result.rows?.[1].items?.[0].id).toBe('metric2');
  });

  it('should respect MIN_NUMBER_OF_COLUMNS when adding fewer metrics', () => {
    const config = createEmptyConfig();
    const result = addMetricToDashboardConfig(['metric1', 'metric2'], config);

    expect(result.rows).toHaveLength(1);
    expect(result.rows?.[0].items).toHaveLength(2);
    expect(result.rows?.[0].columnSizes).toEqual([6, 6]); // 2 equal columns
  });

  it('should respect MAX_NUMBER_OF_COLUMNS when adding many metrics', () => {
    const config = createEmptyConfig();
    const result = addMetricToDashboardConfig(
      [
        'metric1',
        'metric2',
        'metric3',
        'metric4',
        'metric5',
        'metric6',
        'metric7',
        'metric8',
        'metric9',
        'metric10',
        'metric11',
        'metric12',
        'metric13',
      ],
      config
    );

    expect(result.rows).toHaveLength(4);
    expect(result.rows?.[0].items).toHaveLength(4);
    expect(result.rows?.[1].items).toHaveLength(4);
    expect(result.rows?.[2].items).toHaveLength(4);
    expect(result.rows?.[3].items).toHaveLength(1);
    expect(result.rows?.[0].columnSizes).toEqual([3, 3, 3, 3]);
    expect(result.rows?.[3].columnSizes).toEqual([12]); // Single column for last row
  });

  it('should preserve existing rows when adding new metrics', () => {
    const config = createConfigWithRows([
      {
        id: 1,
        items: [{ id: 'existing1' }],
        columnSizes: [12],
        rowHeight: 320,
      },
    ]);

    const result = addMetricToDashboardConfig(['metric1', 'metric2'], config);

    expect(result.rows).toHaveLength(2);
    expect(result.rows?.[0].items[0].id).toBe('existing1');
    expect(result.rows?.[1].items[0].id).toBe('metric1');
    expect(result.rows?.[1].items[1].id).toBe('metric2');
  });

  it('should correctly distribute columns for exactly 2 metrics', () => {
    const config = createEmptyConfig();
    const result = addMetricToDashboardConfig(['metric1', 'metric2'], config);

    expect(result.rows).toHaveLength(1);
    expect(result.rows?.[0].items).toHaveLength(2);
    expect(result.rows?.[0].items.map((item) => item.id)).toEqual(['metric1', 'metric2']);
    expect(result.rows?.[0].columnSizes).toEqual([6, 6]); // Two equal columns of 6
    expect(result.rows?.[0]?.columnSizes?.reduce((a, b) => a + b)).toBe(12); // Sum should be 12
  });

  it('should correctly distribute columns for exactly 3 metrics', () => {
    const config = createEmptyConfig();
    const result = addMetricToDashboardConfig(['metric1', 'metric2', 'metric3'], config);

    expect(result.rows).toHaveLength(1);
    expect(result.rows?.[0].items).toHaveLength(3);
    expect(result.rows?.[0].items.map((item) => item.id)).toEqual([
      'metric1',
      'metric2',
      'metric3',
    ]);
    expect(result.rows?.[0].columnSizes).toEqual([4, 4, 4]); // Three equal columns of 4
    expect(result.rows?.[0].columnSizes?.reduce((a, b) => a + b)).toBe(12); // Sum should be 12
  });

  it('should correctly distribute columns for exactly 4 metrics', () => {
    const config = createEmptyConfig();
    const result = addMetricToDashboardConfig(['metric1', 'metric2', 'metric3', 'metric4'], config);

    expect(result.rows).toHaveLength(1);
    expect(result.rows?.[0].items).toHaveLength(4);
    expect(result.rows?.[0].items.map((item) => item.id)).toEqual([
      'metric1',
      'metric2',
      'metric3',
      'metric4',
    ]);
    expect(result.rows?.[0].columnSizes).toEqual([3, 3, 3, 3]); // Four equal columns of 3
    expect(result.rows?.[0].columnSizes?.reduce((a, b) => a + b)).toBe(12); // Sum should be 12
  });

  it('should correctly distribute columns for exactly 0 metrics', () => {
    const config = createEmptyConfig();
    const result = addMetricToDashboardConfig([], config);

    expect(result.rows).toHaveLength(0);
    expect(result.rows).toBe(config.rows);
  });
});
