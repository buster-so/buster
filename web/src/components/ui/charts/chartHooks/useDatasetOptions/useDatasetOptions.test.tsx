import { renderHook } from '@testing-library/react';
import { useDatasetOptions } from './useDatasetOptions';
import {
  type ChartType,
  type IColumnLabelFormat
} from '../../../../../api/asset_interfaces/metric/charts';

describe('useDatasetOptions', () => {
  const mockData = [
    { month: 'Jan', sales: 100, profit: 50 },
    { month: 'Feb', sales: 200, profit: 100 },
    { month: 'Mar', sales: 300, profit: 150 }
  ];

  const mockColumnLabelFormats: Record<string, IColumnLabelFormat> = {
    sales: { columnType: 'number', style: 'number' },
    profit: { columnType: 'number', style: 'number' },
    month: { columnType: 'text', style: 'string' }
  };

  test('should return the correct axis keys for bar chart', () => {
    const { result } = renderHook(() =>
      useDatasetOptions({
        data: mockData,
        selectedAxis: {
          x: ['month'],
          y: ['sales'],
          tooltip: ['profit']
        },
        selectedChartType: 'bar' as ChartType,
        columnLabelFormats: mockColumnLabelFormats,
        pieMinimumSlicePercentage: 5,
        columnMetadata: [],
        barGroupType: undefined,
        lineGroupType: undefined,
        trendlines: undefined,
        barSortBy: undefined,
        pieSortBy: undefined,
        groupByMethod: undefined
      })
    );

    expect(result.current.yAxisKeys).toEqual(['sales']);
    expect(result.current.tooltipKeys).toEqual(['profit']);
    expect(result.current.hasMismatchedTooltipsAndMeasures).toBe(true);
    expect(result.current.isDownsampled).toBe(false);
  });

  test('should handle empty data correctly', () => {
    const { result } = renderHook(() =>
      useDatasetOptions({
        data: [],
        selectedAxis: {
          x: ['month'],
          y: ['sales', 'profit'],
          tooltip: []
        },
        selectedChartType: 'line' as ChartType,
        columnLabelFormats: mockColumnLabelFormats,
        pieMinimumSlicePercentage: 5,
        columnMetadata: [],
        barGroupType: undefined,
        lineGroupType: undefined,
        trendlines: undefined,
        barSortBy: undefined,
        pieSortBy: undefined,
        groupByMethod: undefined
      })
    );

    expect(result.current.datasetOptions.datasets).toHaveLength(2); // One for each y-axis field
    expect(result.current.datasetOptions.ticks).toEqual(expect.any(Array));
    expect(result.current.yAxisKeys).toEqual(['sales', 'profit']);
    expect(result.current.hasMismatchedTooltipsAndMeasures).toBe(false);
  });
});
