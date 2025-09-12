import { describe, expect, it } from 'vitest';
import type { BusterDashboard } from '@/api/asset_interfaces/dashboard';
import { addAndRemoveMetricsToDashboard } from './addAndRemoveMetricsToDashboard';

describe('addAndRemoveMetricsToDashboard', () => {
  const createMockConfig = (metricIds: string[]): BusterDashboard['config'] => ({
    rows: [
      {
        id: 1,
        items: metricIds.map((id) => ({ id })),
        columnSizes: Array(metricIds.length).fill(12 / metricIds.length),
        rowHeight: 320,
      },
    ],
  });

  it('should return existing config when no changes are needed', () => {
    const existingConfig = createMockConfig(['metric-1', 'metric-2']);
    const result = addAndRemoveMetricsToDashboard(['metric-1', 'metric-2'], existingConfig);
    expect(result).toEqual(existingConfig);
    // Verify order is maintained
    expect(result.rows?.[0].items.map((item) => item.id)).toEqual(['metric-1', 'metric-2']);
  });

  it('should add new metrics when they dont exist in the dashboard', () => {
    const existingConfig = createMockConfig(['metric-1']);
    const result = addAndRemoveMetricsToDashboard(
      ['metric-1', 'metric-2', 'metric-3'],
      existingConfig
    );

    // Verify metrics were added in the correct order
    const resultMetricIds = result.rows?.[0].items.map((item) => item.id);
    expect(result.rows?.[0].items.map((item) => item.id)).toEqual(['metric-1']);
    expect(result.rows?.[1].items.map((item) => item.id)).toEqual(['metric-2', 'metric-3']);
  });

  it('should remove metrics that are not in the provided array while maintaining order', () => {
    const existingConfig = createMockConfig(['metric-1', 'metric-2', 'metric-3']);
    const result = addAndRemoveMetricsToDashboard(['metric-1', 'metric-3'], existingConfig);

    // Verify metric was removed while maintaining order of remaining metrics
    const resultMetricIds = result.rows?.[0].items.map((item) => item.id);
    expect(resultMetricIds).toEqual(['metric-1', 'metric-3']);
    expect(resultMetricIds?.length).toBe(2);
  });

  it('should handle both adding and removing metrics simultaneously while maintaining order', () => {
    const existingConfig = createMockConfig(['metric-1', 'metric-2', 'metric-3']);
    const result = addAndRemoveMetricsToDashboard(
      ['metric-1', 'metric-4', 'metric-5'],
      existingConfig
    );

    // Verify correct metrics were added and removed in the right order
    expect(result.rows?.[0].items.map((item) => item.id)).toEqual(['metric-1']); // Order should match input array
    expect(result.rows?.[1].items.map((item) => item.id)).toEqual(['metric-4', 'metric-5']); // Order should match input array
  });

  it('should handle empty input array by removing all metrics', () => {
    const existingConfig = createMockConfig(['metric-1', 'metric-2']);
    const result = addAndRemoveMetricsToDashboard([], existingConfig);

    // Verify all metrics were removed
    expect(result.rows?.length).toBe(0);
  });

  it('should handle empty existing config by adding all metrics in order', () => {
    const emptyConfig: BusterDashboard['config'] = { rows: [] };
    const result = addAndRemoveMetricsToDashboard(['metric-1', 'metric-2'], emptyConfig);

    // Verify all metrics were added in the correct order
    const resultMetricIds = result.rows?.[0].items.map((item) => item.id);
    expect(resultMetricIds).toEqual(['metric-1', 'metric-2']);
  });

  it('should maintain correct column sizes and order when removing metrics', () => {
    const existingConfig = createMockConfig(['metric-1', 'metric-2', 'metric-3']);
    const result = addAndRemoveMetricsToDashboard(['metric-1', 'metric-3'], existingConfig);

    // Verify column sizes are updated correctly while maintaining order
    expect(result.rows?.[0].columnSizes).toEqual([6, 6]); // 12/2 = 6 for each column
    expect(result.rows?.[0].items.map((item) => item.id)).toEqual(['metric-1', 'metric-3']);
  });

  it('should handle multiple rows and maintain order within each row', () => {
    const existingConfig: BusterDashboard['config'] = {
      rows: [
        {
          id: 1,
          items: [{ id: 'metric-1' }, { id: 'metric-2' }],
          columnSizes: [6, 6],
          rowHeight: 320,
        },
        {
          id: 2,
          items: [{ id: 'metric-3' }, { id: 'metric-4' }],
          columnSizes: [6, 6],
          rowHeight: 320,
        },
      ],
    };

    const result = addAndRemoveMetricsToDashboard(
      ['metric-1', 'metric-3', 'metric-5'],
      existingConfig
    );

    // Verify order is maintained in each row after modifications
    expect(result.rows?.[0].items.map((item) => item.id)).toEqual(['metric-1']);
    expect(result.rows?.[0].columnSizes).toEqual([12]);

    expect(result.rows?.[1].items.map((item) => item.id)).toEqual(['metric-3']);
    expect(result.rows?.[1].columnSizes).toEqual([12]);

    expect(result.rows?.[2].items.map((item) => item.id)).toEqual(['metric-5']);
    expect(result.rows?.[2].columnSizes).toEqual([12]);
  });
});
