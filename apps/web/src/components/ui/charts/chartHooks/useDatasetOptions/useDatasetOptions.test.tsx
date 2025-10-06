import {
  type ChartType,
  type ColumnLabelFormat,
  DEFAULT_COLUMN_LABEL_FORMAT,
} from '@buster/server-shared/metrics';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDatasetOptions } from './useDatasetOptions';

describe('useDatasetOptions', () => {
  const mockData = [
    { month: 'Jan', sales: 100, profit: 50 },
    { month: 'Feb', sales: 200, profit: 100 },
    { month: 'Mar', sales: 300, profit: 150 },
  ];

  const mockColumnLabelFormats: Record<string, ColumnLabelFormat> = {
    sales: { ...DEFAULT_COLUMN_LABEL_FORMAT, columnType: 'number', style: 'number' },
    profit: { ...DEFAULT_COLUMN_LABEL_FORMAT, columnType: 'number', style: 'number' },
    month: { ...DEFAULT_COLUMN_LABEL_FORMAT, columnType: 'text', style: 'string' },
    level: { ...DEFAULT_COLUMN_LABEL_FORMAT, columnType: 'text', style: 'string' },
  };
  it('should return the correct axis keys for bar chart', () => {
    const { result } = renderHook(() =>
      useDatasetOptions({
        data: mockData,
        selectedAxis: {
          x: ['month'],
          y: ['sales'],
          tooltip: ['profit'],
        },
        selectedChartType: 'bar' as ChartType,
        columnLabelFormats: mockColumnLabelFormats,
        pieMinimumSlicePercentage: 5,
        columnMetadata: [],
        barGroupType: undefined,
        lineGroupType: null,
        trendlines: undefined,
        barSortBy: undefined,
        pieSortBy: undefined,
        groupByMethod: undefined,
        colors: [],
      } as unknown as any)
    );

    expect(result.current.yAxisKeys).toEqual(['sales']);
    expect(result.current.tooltipKeys).toEqual(['profit']);
    expect(result.current.hasMismatchedTooltipsAndMeasures).toBe(true);
    expect(result.current.isDownsampled).toBe(false);
  });
  it('should handle empty data correctly', () => {
    const { result } = renderHook(() =>
      useDatasetOptions({
        data: [],
        selectedAxis: {
          x: ['month'],
          y: ['sales', 'profit'],
          tooltip: [],
        },
        selectedChartType: 'line' as ChartType,
        columnLabelFormats: mockColumnLabelFormats,
        pieMinimumSlicePercentage: 5,
        columnMetadata: [],
        barGroupType: undefined,
        lineGroupType: null,
        trendlines: undefined,
        barSortBy: undefined,
        pieSortBy: undefined,
        groupByMethod: undefined,
        colors: [],
      } as unknown as any)
    );

    expect(result.current.datasetOptions.datasets).toHaveLength(2); // One for each y-axis field
    expect(result.current.datasetOptions.ticks).toEqual(expect.any(Array));
    expect(result.current.yAxisKeys).toEqual(['sales', 'profit']);
    expect(result.current.hasMismatchedTooltipsAndMeasures).toBe(false);
  });

  it('should create separate datasets when colorBy is present', () => {
    const mockDataWithCategories = [
      { month: 'Jan', sales: 100, level: 'Level 1' },
      { month: 'Feb', sales: 200, level: 'Level 2' },
      { month: 'Mar', sales: 300, level: 'Level 1' },
    ];

    const { result } = renderHook(() =>
      useDatasetOptions({
        data: mockDataWithCategories,
        selectedAxis: {
          x: ['month'],
          y: ['sales'],
          tooltip: ['level'], // Include the level field in tooltip so it's available for coloring
          colorBy: ['level'],
        },
        selectedChartType: 'bar' as ChartType,
        columnLabelFormats: mockColumnLabelFormats,
        pieMinimumSlicePercentage: 5,
        columnMetadata: [],
        barGroupType: undefined,
        lineGroupType: null,
        trendlines: undefined,
        barSortBy: undefined,
        pieSortBy: undefined,
        groupByMethod: undefined,
        colors: ['#FF0000', '#00FF00', '#0000FF'],
      } as unknown as any)
    );

    const datasets = result.current.datasetOptions.datasets;
    expect(datasets).toHaveLength(2); // One dataset for each unique level value

    // Check first dataset (Level 1)
    const level1Dataset = datasets.find((d) => d.label[0]?.value === 'Level 1');
    expect(level1Dataset).toBeDefined();
    expect(level1Dataset?.data).toEqual([100, null, 300]); // Jan=100, Feb=null, Mar=300
    expect(level1Dataset?.colors).toEqual('#FF0000'); // Single color string
    expect(level1Dataset?.id).toEqual('sales1');

    // Check second dataset (Level 2)
    const level2Dataset = datasets.find((d) => d.label[0]?.value === 'Level 2');
    expect(level2Dataset).toBeDefined();
    expect(level2Dataset?.data).toEqual([null, 200, null]); // Jan=null, Feb=200, Mar=null
    expect(level2Dataset?.colors).toEqual('#00FF00'); // Single color string
    expect(level2Dataset?.id).toEqual('sales2');
  });

  it('should not apply colors when colorBy is null', () => {
    const { result } = renderHook(() =>
      useDatasetOptions({
        data: mockData,
        selectedAxis: {
          x: ['month'],
          y: ['sales'],
          tooltip: null,
          colorBy: null,
        },
        selectedChartType: 'bar' as ChartType,
        columnLabelFormats: mockColumnLabelFormats,
        pieMinimumSlicePercentage: 5,
        columnMetadata: [],
        barGroupType: undefined,
        lineGroupType: null,
        trendlines: undefined,
        barSortBy: undefined,
        pieSortBy: undefined,
        groupByMethod: undefined,
        colors: ['#FF0000', '#00FF00', '#0000FF'],
      } as unknown as any)
    );

    const datasets = result.current.datasetOptions.datasets;
    expect(datasets).toHaveLength(1);

    const dataset = datasets[0];
    expect(dataset?.colors).toBeUndefined();
  });

  it('should include metric key in labels when both colorBy and y2 are present', () => {
    const mockComboData = [
      { month: 'Jan', sales: 100, profit: 50, type: 'Home' },
      { month: 'Feb', sales: 200, profit: 80, type: 'Away' },
      { month: 'Mar', sales: 300, profit: 120, type: 'Home' },
    ];

    const mockComboColumnLabelFormats: Record<string, ColumnLabelFormat> = {
      ...mockColumnLabelFormats,
      type: { ...DEFAULT_COLUMN_LABEL_FORMAT, columnType: 'text', style: 'string' },
    };

    const { result } = renderHook(() =>
      useDatasetOptions({
        data: mockComboData,
        selectedAxis: {
          x: ['month'],
          y: ['sales'],
          y2: ['profit'],
          tooltip: ['type'],
          colorBy: ['type'],
        },
        selectedChartType: 'combo' as ChartType,
        columnLabelFormats: mockComboColumnLabelFormats,
        pieMinimumSlicePercentage: 5,
        columnMetadata: [],
        barGroupType: undefined,
        lineGroupType: null,
        trendlines: undefined,
        barSortBy: undefined,
        pieSortBy: undefined,
        groupByMethod: undefined,
        colors: ['#FF0000', '#00FF00'],
      } as unknown as any)
    );

    const datasets = result.current.datasetOptions.datasets;
    expect(datasets).toHaveLength(4); // 2 colors × 2 metrics (sales, profit)

    // Check that y-axis datasets include metric key when there are multiple y-axes
    const salesHomeDataset = datasets.find(
      (d) => d.dataKey === 'sales' && d.label.some((l) => l.value === 'Home')
    );
    expect(salesHomeDataset).toBeDefined();
    expect(salesHomeDataset?.label).toEqual([
      { key: 'sales', value: '' },
      { key: 'type', value: 'Home' },
    ]);

    const profitAwayDataset = datasets.find(
      (d) => d.dataKey === 'profit' && d.label.some((l) => l.value === 'Away')
    );
    expect(profitAwayDataset).toBeDefined();
    expect(profitAwayDataset?.label).toEqual([
      { key: 'profit', value: '' },
      { key: 'type', value: 'Away' },
    ]);
  });
});
