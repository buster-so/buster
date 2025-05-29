import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
/**
 * @jest-environment jsdom
 */

import { Chart } from 'chart.js';
import { ChartTotalizerPlugin } from './chartjs-plugin-totalizer';

// Mock canvas and Chart.js setup
beforeAll(() => {
  // Register the plugin
  Chart.register(ChartTotalizerPlugin);
});

describe('ChartTotalizerPlugin', () => {
  let mockChart: any;
  const mockArgs = { mode: 'none' } as any;

  beforeEach(() => {
    // Create a mock chart instance
    mockChart = {
      $totalizer: undefined,
      data: {
        labels: ['A', 'B', 'C'],
        datasets: [
          {
            data: [10, 20, 30],
            label: 'Dataset 1',
            hidden: false
          }
        ]
      },
      getDatasetMeta: (index: number) => ({
        hidden: mockChart.data.datasets[index].hidden
      })
    };
  });
  it('plugin initializes with empty totals', () => {
    // Call the start hook
    ChartTotalizerPlugin.start?.(mockChart, mockArgs, { enabled: true });

    expect(mockChart.$totalizer).toBeDefined();
    expect(mockChart.$totalizer.stackTotals).toEqual({});
    expect(mockChart.$totalizer.seriesTotals).toEqual([]);
  });
  it('calculates correct stack totals for visible datasets', () => {
    // Set up multiple datasets
    mockChart.data.datasets = [
      { data: [10, 20, 30], label: 'Dataset 1', hidden: false },
      { data: [5, 15, 25], label: 'Dataset 2', hidden: false }
    ];

    // Call the plugin hooks
    ChartTotalizerPlugin.start?.(mockChart, mockArgs, { enabled: true });
    ChartTotalizerPlugin.beforeDatasetsUpdate?.(mockChart, mockArgs, { enabled: true });

    expect(mockChart.$totalizer.stackTotals).toEqual({
      0: 15, // 10 + 5
      1: 35, // 20 + 15
      2: 55 // 30 + 25
    });
  });
  it('ignores hidden datasets in calculations', () => {
    // Set up datasets with one hidden
    mockChart.data.datasets = [
      { data: [10, 20, 30], label: 'Dataset 1', hidden: false },
      { data: [5, 15, 25], label: 'Dataset 2', hidden: true }
    ];

    // Call the plugin hooks
    ChartTotalizerPlugin.start?.(mockChart, mockArgs, { enabled: true });
    ChartTotalizerPlugin.beforeDatasetsUpdate?.(mockChart, mockArgs, { enabled: true });

    expect(mockChart.$totalizer.stackTotals).toEqual({
      0: 10,
      1: 20,
      2: 30
    });
  });
  it('calculates correct series totals', () => {
    // Set up multiple datasets
    mockChart.data.datasets = [
      { data: [10, 20, 30], label: 'Dataset 1', hidden: false },
      { data: [5, 15, 25], label: 'Dataset 2', hidden: false }
    ];

    // Call the plugin hooks
    ChartTotalizerPlugin.start?.(mockChart, mockArgs, { enabled: true });
    ChartTotalizerPlugin.beforeDatasetsUpdate?.(mockChart, mockArgs, { enabled: true });

    expect(mockChart.$totalizer.seriesTotals).toEqual([
      60, // 10 + 20 + 30
      45 // 5 + 15 + 25
    ]);
  });
});
