import { describe, expect, it } from 'vitest';
import type { BusterDashboard } from '@/api/asset_interfaces/dashboard';
import { removeMetricFromDashboardConfig } from './removeMetricFromDashboard';

describe('removeMetricFromDashboardConfig', () => {
  const createEmptyConfig = (): BusterDashboard['config'] => ({
    rows: [],
  });

  const createConfigWithRows = (
    rows: BusterDashboard['config']['rows']
  ): BusterDashboard['config'] => ({
    rows,
  });

  it('should return the same config if no metrics to remove are provided', () => {
    const config = createConfigWithRows([
      {
        id: 1,
        items: [{ id: 'metric1' }],
        columnSizes: [12],
        rowHeight: 320,
      },
    ]);
    const result = removeMetricFromDashboardConfig([], config);
    expect(result.rows).toHaveLength(1);
    expect(result.rows?.[0].items).toHaveLength(1);
  });

  it('should remove a single metric from a single row', () => {
    const config = createConfigWithRows([
      {
        id: 1,
        items: [{ id: 'metric1' }, { id: 'metric2' }],
        columnSizes: [6, 6],
        rowHeight: 320,
      },
    ]);
    const result = removeMetricFromDashboardConfig(['metric1'], config);

    expect(result.rows).toHaveLength(1);
    expect(result.rows?.[0].items).toHaveLength(1);
    expect(result.rows?.[0].items[0].id).toBe('metric2');
    expect(result.rows?.[0].items.length).toBe(1);
    expect(result.rows?.[0].columnSizes).toEqual([12]); // Single column takes full width
  });

  it('should remove multiple metrics from a single row', () => {
    const config = createConfigWithRows([
      {
        id: 1,
        items: [{ id: 'metric1' }, { id: 'metric2' }, { id: 'metric3' }, { id: 'metric4' }],
        columnSizes: [3, 3, 3, 3],
        rowHeight: 320,
      },
    ]);
    const result = removeMetricFromDashboardConfig(['metric1', 'metric3'], config);

    expect(result.rows).toHaveLength(1);
    expect(result.rows?.[0].items).toHaveLength(2);
    expect(result.rows?.[0].items.map((item) => item.id)).toEqual(['metric2', 'metric4']);
    expect(result.rows?.[0].columnSizes).toEqual([6, 6]); // Two equal columns
  });

  it('should remove entire row when all metrics in the row are removed', () => {
    const config = createConfigWithRows([
      {
        id: 1,
        items: [{ id: 'metric1' }, { id: 'metric2' }],
        columnSizes: [6, 6],
        rowHeight: 320,
      },
      {
        id: 2,
        items: [{ id: 'metric3' }],
        columnSizes: [12],
        rowHeight: 320,
      },
    ]);
    const result = removeMetricFromDashboardConfig(['metric1', 'metric2'], config);

    expect(result.rows).toHaveLength(1);
    expect(result.rows?.[0].items).toHaveLength(1);
    expect(result.rows?.[0].items.length).toBe(1);
    expect(result.rows?.[0].columnSizes).toEqual([12]);
    expect(result.rows?.[0].id).toBe(2);
    expect(result.rows?.[0].items[0].id).toBe('metric3');
  });

  it('should handle removing metrics from multiple rows', () => {
    const config = createConfigWithRows([
      {
        id: 1,
        items: [{ id: 'metric1' }, { id: 'metric2' }],
        columnSizes: [6, 6],
        rowHeight: 320,
      },
      {
        id: 2,
        items: [{ id: 'metric3' }, { id: 'metric4' }],
        columnSizes: [6, 6],
        rowHeight: 320,
      },
    ]);
    const result = removeMetricFromDashboardConfig(['metric1', 'metric4'], config);

    expect(result.rows).toHaveLength(2);
    expect(result.rows?.[0].items).toHaveLength(1);
    expect(result.rows?.[1].items).toHaveLength(1);
    expect(result.rows?.[0].items[0].id).toBe('metric2');
    expect(result.rows?.[1].items[0].id).toBe('metric3');
    expect(result.rows?.[0].columnSizes).toEqual([12]);
    expect(result.rows?.[1].columnSizes).toEqual([12]);
  });

  it('should handle removing non-existent metrics', () => {
    const config = createConfigWithRows([
      {
        id: 1,
        items: [{ id: 'metric1' }, { id: 'metric2' }],
        columnSizes: [6, 6],
        rowHeight: 320,
      },
    ]);
    const result = removeMetricFromDashboardConfig(['nonexistent1', 'nonexistent2'], config);

    expect(result.rows).toHaveLength(1);
    expect(result.rows?.[0].items).toHaveLength(2);
    expect(result.rows?.[0].columnSizes).toEqual([6, 6]);
  });

  it('should handle empty config', () => {
    const config = createEmptyConfig();
    const result = removeMetricFromDashboardConfig(['metric1'], config);

    expect(result.rows).toHaveLength(0);
  });

  it('should preserve row properties while updating items and columnSizes', () => {
    const config = createConfigWithRows([
      {
        id: 1,
        items: [{ id: 'metric1' }, { id: 'metric2' }, { id: 'metric3' }],
        columnSizes: [4, 4, 4],
        rowHeight: 320,
      },
    ]);
    const result = removeMetricFromDashboardConfig(['metric2'], config);

    expect(result.rows?.[0]).toMatchObject({
      id: 1,
      rowHeight: 320,
    });
    expect(result.rows?.[0].items).toHaveLength(2);
    expect(result.rows?.[0].columnSizes).toEqual([6, 6]);
  });

  it('should handle removing all metrics from config', () => {
    const config = createConfigWithRows([
      {
        id: 1,
        items: [{ id: 'metric1' }, { id: 'metric2' }],
        columnSizes: [6, 6],
        rowHeight: 320,
      },
      {
        id: 2,
        items: [{ id: 'metric3' }],
        columnSizes: [12],
        rowHeight: 320,
      },
    ]);
    const result = removeMetricFromDashboardConfig(['metric1', 'metric2', 'metric3'], config);

    expect(result.rows).toHaveLength(0);
  });

  it('should correctly remove metrics from a large config with multiple rows', () => {
    const config = createConfigWithRows([
      {
        id: 1,
        items: [{ id: 'metric1' }, { id: 'metric2' }],
        columnSizes: [6, 6],
        rowHeight: 320,
      },
      {
        id: 2,
        items: [{ id: 'metric3' }, { id: 'metric4' }, { id: 'metric5' }],
        columnSizes: [4, 4, 4],
        rowHeight: 320,
      },
      {
        id: 3,
        items: [{ id: 'metric6' }],
        columnSizes: [12],
        rowHeight: 320,
      },
      {
        id: 4,
        items: [{ id: 'metric7' }, { id: 'metric8' }, { id: 'metric9' }, { id: 'metric10' }],
        columnSizes: [3, 3, 3, 3],
        rowHeight: 320,
      },
      {
        id: 5,
        items: [{ id: 'metric11' }, { id: 'metric12' }],
        columnSizes: [6, 6],
        rowHeight: 320,
      },
    ]);

    const result = removeMetricFromDashboardConfig(['metric2', 'metric4', 'metric11'], config);

    expect(result.rows).toHaveLength(5);
    // Check row 1
    expect(result.rows?.[0].items).toHaveLength(1);
    expect(result.rows?.[0].items[0].id).toBe('metric1');
    expect(result.rows?.[0].columnSizes).toEqual([12]);
    // Check row 2
    expect(result.rows?.[1].items).toHaveLength(2);
    expect(result.rows?.[1].items.map((item) => item.id)).toEqual(['metric3', 'metric5']);
    expect(result.rows?.[1].columnSizes).toEqual([6, 6]);
    // Check row 3 (unchanged)
    expect(result.rows?.[2].items).toHaveLength(1);
    expect(result.rows?.[2].items[0].id).toBe('metric6');
    // Check row 4 (unchanged)
    expect(result.rows?.[3].items).toHaveLength(4);
    expect(result.rows?.[3].columnSizes).toEqual([3, 3, 3, 3]);
    // Check row 5
    expect(result.rows?.[4].items).toHaveLength(1);
    expect(result.rows?.[4].items[0].id).toBe('metric12');
    expect(result.rows?.[4].columnSizes).toEqual([12]);
  });

  it('should handle removing non-existent metrics while preserving existing structure', () => {
    const config = createConfigWithRows([
      {
        id: 1,
        items: [{ id: 'metric1' }, { id: 'metric2' }, { id: 'metric3' }],
        columnSizes: [4, 4, 4],
        rowHeight: 320,
      },
      {
        id: 2,
        items: [{ id: 'metric4' }, { id: 'metric5' }],
        columnSizes: [6, 6],
        rowHeight: 320,
      },
    ]);

    const result = removeMetricFromDashboardConfig(
      ['nonexistent1', 'nonexistent2', 'metric1'],
      config
    );

    // Should only remove metric1 and ignore non-existent metrics
    expect(result.rows).toHaveLength(2);
    // Check first row
    expect(result.rows?.[0].items).toHaveLength(2);
    expect(result.rows?.[0].items.map((item) => item.id)).toEqual(['metric2', 'metric3']);
    expect(result.rows?.[0].columnSizes).toEqual([6, 6]);
    // Check second row (should be unchanged)
    expect(result.rows?.[1].items).toHaveLength(2);
    expect(result.rows?.[1].items.map((item) => item.id)).toEqual(['metric4', 'metric5']);
    expect(result.rows?.[1].columnSizes).toEqual([6, 6]);
  });
});
