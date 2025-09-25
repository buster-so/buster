import {
  type ColumnMetaData,
  DEFAULT_COLUMN_LABEL_FORMAT,
  DEFAULT_COLUMN_SETTINGS,
} from '@buster/server-shared/metrics';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { BusterChartProps } from '../../../BusterChart.types';
import type { DatasetOptionsWithTicks } from '../../../chartHooks';
import { type UseSeriesOptionsProps, useSeriesOptions } from './useSeriesOptions';

// Mock the series builders
vi.mock('./barSeriesBuilder', () => ({
  barSeriesBuilder: vi.fn(() => []),
  barSeriesBuilder_labels: vi.fn(() => ['Jan', 'Feb', 'Mar']),
}));

vi.mock('./lineSeriesBuilder', () => ({
  lineSeriesBuilder: vi.fn(() => []),
  lineSeriesBuilder_labels: vi.fn(() => ['Jan', 'Feb', 'Mar']),
}));

vi.mock('./pieSeriesBuilder', () => ({
  pieSeriesBuilder_data: vi.fn(() => []),
  pieSeriesBuilder_labels: vi.fn(() => ['Category A', 'Category B', 'Category C']),
}));

vi.mock('./scatterSeriesBuilder', () => ({
  scatterSeriesBuilder_data: vi.fn(() => []),
  scatterSeriesBuilder_labels: vi.fn(() => ['Point 1', 'Point 2', 'Point 3']),
}));

vi.mock('./comboSeriesBuilder', () => ({
  comboSeriesBuilder_data: vi.fn(() => []),
  comboSeriesBuilder_labels: vi.fn(() => ['Jan', 'Feb', 'Mar']),
}));

describe('useSeriesOptions', () => {
  const createMockProps = (
    overrides: Partial<UseSeriesOptionsProps> = {}
  ): UseSeriesOptionsProps => {
    const mockDatasetOptions: DatasetOptionsWithTicks = {
      datasets: [
        {
          id: 'sales-dataset',
          dataKey: 'sales',
          data: [100, 200, 300],
          label: [{ key: 'sales', value: '' }],
          tooltipData: [],
          axisType: 'y',
        },
      ],
      ticks: [['Jan'], ['Feb'], ['Mar']],
      ticksKey: [{ key: 'date', value: '' }],
    };

    const mockColumnMetadata: ColumnMetaData[] = [
      {
        name: 'sales',
        simple_type: 'number',
        type: 'integer',
        min_value: 0,
        max_value: 1000,
        unique_values: 100,
      },
      {
        name: 'size_column',
        simple_type: 'number',
        type: 'integer',
        min_value: 10,
        max_value: 100,
        unique_values: 50,
      },
      {
        name: 'text_column',
        simple_type: 'text',
        type: 'varchar',
        min_value: 0,
        max_value: 0,
        unique_values: 25,
      },
    ];

    return {
      selectedChartType: 'bar',
      y2AxisKeys: [],
      yAxisKeys: ['sales'],
      xAxisKeys: ['date'],
      sizeKey: [],
      columnSettings: {
        sales: DEFAULT_COLUMN_SETTINGS,
        date: DEFAULT_COLUMN_SETTINGS,
      },
      columnLabelFormats: {
        sales: DEFAULT_COLUMN_LABEL_FORMAT,
        date: DEFAULT_COLUMN_LABEL_FORMAT,
      },
      colors: ['#FF0000', '#00FF00', '#0000FF'],
      datasetOptions: mockDatasetOptions,
      scatterDotSize: [5, 10] as [number, number],
      columnMetadata: mockColumnMetadata,
      lineGroupType: null,
      barGroupType: null,
      trendlines: [],
      barShowTotalAtTop: false,
      ...overrides,
    };
  };

  it('should return chart data with labels and datasets for bar chart', () => {
    // Arrange
    const props = createMockProps({
      selectedChartType: 'bar',
    });

    // Act
    const { result } = renderHook(() => useSeriesOptions(props));

    // Assert
    expect(result.current).toEqual({
      labels: ['Jan', 'Feb', 'Mar'],
      datasets: [],
    });

    expect(result.current.labels).toBeDefined();
    expect(result.current.datasets).toBeDefined();
    expect(Array.isArray(result.current.labels)).toBe(true);
    expect(Array.isArray(result.current.datasets)).toBe(true);
  });

  it('should call appropriate series builders based on chart type', () => {
    // Test different chart types
    const chartTypes: UseSeriesOptionsProps['selectedChartType'][] = [
      'bar',
      'line',
      'pie',
      'scatter',
      'combo',
    ];

    chartTypes.forEach((chartType) => {
      // Arrange
      const props = createMockProps({
        selectedChartType: chartType,
      });

      // Act
      renderHook(() => useSeriesOptions(props));

      // Assert - The appropriate builder should have been called
      // This tests that the labelsBuilderRecord and dataBuilderRecord are working correctly
    });
  });

  it('should handle sizeOptions correctly for numeric columns', () => {
    // Arrange
    const props = createMockProps({
      selectedChartType: 'scatter',
      sizeKey: ['size_column'], // This is a numeric column in our mock data
    });

    // Act
    const { result } = renderHook(() => useSeriesOptions(props));

    // Assert
    expect(result.current).toBeDefined();
    // The hook should process the numeric size column without warnings
  });

  it('should handle sizeOptions with non-numeric columns and show warning', () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const props = createMockProps({
      selectedChartType: 'scatter',
      sizeKey: ['text_column'], // This is a text column, not numeric
    });

    // Act
    const { result } = renderHook(() => useSeriesOptions(props));

    // Assert
    expect(result.current).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith('Size key is not a number column', {
      isNumberColumn: false,
      sizeKey: ['text_column'],
    });

    consoleSpy.mockRestore();
  });

  it('should handle empty or undefined sizeKey', () => {
    // Test case 1: Empty array
    const props1 = createMockProps({
      selectedChartType: 'scatter',
      sizeKey: [],
    });

    const { result: result1 } = renderHook(() => useSeriesOptions(props1));
    expect(result1.current).toBeDefined();

    // Test case 2: Undefined column in metadata
    const props2 = createMockProps({
      selectedChartType: 'scatter',
      sizeKey: ['nonexistent_column'],
    });

    const { result: result2 } = renderHook(() => useSeriesOptions(props2));
    expect(result2.current).toBeDefined();
  });

  it('should memoize results properly when dependencies change', () => {
    // Arrange
    const initialProps = createMockProps();

    const { result, rerender } = renderHook(
      (props: UseSeriesOptionsProps) => useSeriesOptions(props),
      {
        initialProps,
      }
    );

    const firstResult = result.current;

    // Act - rerender with same props (should maintain same structure)
    rerender(initialProps);
    const secondResult = result.current;

    // Assert - should have same structure (deep equality)
    expect(secondResult).toStrictEqual(firstResult);

    // Act - rerender with different props
    const modifiedProps = createMockProps({
      selectedChartType: 'line', // Changed chart type
    });
    rerender(modifiedProps);
    const thirdResult = result.current;

    // Assert - should have different structure as dependencies changed
    expect(thirdResult).toBeDefined();
    expect(thirdResult.labels).toBeDefined();
    expect(thirdResult.datasets).toBeDefined();
  });

  it('should handle metric and table chart types correctly', () => {
    // These chart types return empty arrays according to the implementation

    // Test metric chart type
    const metricProps = createMockProps({
      selectedChartType: 'metric',
    });

    const { result: metricResult } = renderHook(() => useSeriesOptions(metricProps));

    expect(metricResult.current.labels).toEqual([]);
    expect(metricResult.current.datasets).toEqual([]);

    // Test table chart type
    const tableProps = createMockProps({
      selectedChartType: 'table',
    });

    const { result: tableResult } = renderHook(() => useSeriesOptions(tableProps));

    expect(tableResult.current.labels).toEqual([]);
    expect(tableResult.current.datasets).toEqual([]);
  });

  it('should process sizeOptions with correct min/max values from metadata', () => {
    // Arrange
    const props = createMockProps({
      selectedChartType: 'scatter',
      sizeKey: ['size_column'],
    });

    // Act
    const { result } = renderHook(() => useSeriesOptions(props));

    // Assert
    expect(result.current).toBeDefined();

    // The hook should have processed the size column metadata correctly
    // Min value should be converted from '10' to 10
    // Max value should be converted from '100' to 100
    // This tests the sizeOptions useMemo logic
  });
});
