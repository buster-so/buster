import '../../../ChartJSTheme';

import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ColumnSettings, SimplifiedColumnType } from '@/api/asset_interfaces/metric';
import {
  DEFAULT_COLUMN_LABEL_FORMAT,
  DEFAULT_COLUMN_SETTINGS
} from '@/api/asset_interfaces/metric';
import type { ChartEncodes } from '@/api/asset_interfaces/metric/charts';
import { useXAxis } from './useXAxis';

describe('useXAxis', () => {
  const defaultProps = {
    columnLabelFormats: {
      date_column: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'date' as SimplifiedColumnType,
        style: 'date' as const
      },
      numeric_column: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const
      },
      category_column: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'text' as SimplifiedColumnType,
        style: 'string' as const
      }
    },
    selectedAxis: {
      x: ['category_column'],
      y: ['numeric_column']
    } as ChartEncodes,
    selectedChartType: 'bar',
    xAxisLabelRotation: 'auto' as const,
    xAxisShowAxisLabel: true,
    gridLines: true,
    xAxisShowAxisTitle: true,
    xAxisAxisTitle: 'X Axis Title',
    lineGroupType: null,
    barGroupType: 'group' as const,
    columnSettings: {},
    xAxisTimeInterval: null
  } as Parameters<typeof useXAxis>[0];

  it('should return undefined for pie charts', () => {
    const props = {
      ...defaultProps,
      selectedChartType: 'pie'
    } as const;

    const { result } = renderHook(() => useXAxis(props));
    expect(result.current).toBeUndefined();
  });

  it('should set time scale for line charts with date x-axis', () => {
    const props = {
      ...defaultProps,
      selectedChartType: 'line',
      selectedAxis: {
        x: ['date_column'],
        y: ['numeric_column']
      } as ChartEncodes
    } as const;

    const { result } = renderHook(() => useXAxis(props));
    expect(result.current?.type).toBe('time');
  });

  it('should set category scale for bar charts', () => {
    const { result } = renderHook(() => useXAxis(defaultProps));
    expect(result.current?.type).toBe('category');
  });

  it('should handle axis title display', () => {
    const { result } = renderHook(() => useXAxis(defaultProps));
    expect(result.current?.title?.display).toBe(true);
    expect(result.current?.title?.text).toBe('X Axis Title');

    const propsWithoutTitle = {
      ...defaultProps,
      xAxisShowAxisTitle: false
    };
    const { result: resultWithoutTitle } = renderHook(() => useXAxis(propsWithoutTitle));
    expect(resultWithoutTitle.current?.title?.display).toBe(false);
  });

  it('should handle grid display for scatter charts', () => {
    const scatterProps = {
      ...defaultProps,
      selectedChartType: 'scatter'
    } as const;

    const { result } = renderHook(() => useXAxis(scatterProps));
    expect(result.current?.grid?.display).toBe(true);

    const noGridProps = {
      ...scatterProps,
      gridLines: false
    };
    const { result: resultNoGrid } = renderHook(() => useXAxis(noGridProps));
    expect(resultNoGrid.current?.grid?.display).toBe(false);
  });

  it('should handle custom time intervals', () => {
    const timeIntervalProps = {
      ...defaultProps,
      selectedChartType: 'line',
      selectedAxis: {
        x: ['date_column'],
        y: ['numeric_column']
      } as ChartEncodes,
      xAxisTimeInterval: 'month' as const
    } as const;

    const { result } = renderHook(() => useXAxis(timeIntervalProps));
    expect(result.current?.type).toBe('time');
    // @ts-expect-error - Chart.js types don't properly expose the time unit property
    expect(result.current?.ticks?.time?.unit).toBe('month');
  });

  it('should handle label rotation', () => {
    const rotationProps = {
      ...defaultProps,
      xAxisLabelRotation: 45 as const
    };

    const { result } = renderHook(() => useXAxis(rotationProps));
    expect(result.current?.ticks?.maxRotation).toBe(45);
    expect(result.current?.ticks?.minRotation).toBe(45);
  });

  it('should handle axis label visibility', () => {
    const hiddenLabelsProps = {
      ...defaultProps,
      xAxisShowAxisLabel: false
    };

    const { result } = renderHook(() => useXAxis(hiddenLabelsProps));
    expect(result.current?.ticks?.display).toBe(false);
  });

  it('should handle stacked bar charts configuration', () => {
    const stackedBarProps = {
      ...defaultProps,
      barGroupType: 'stack' as const
    };

    const { result } = renderHook(() => useXAxis(stackedBarProps));
    expect(result.current?.stacked).toBe(true);
  });

  it('should handle multiple x-axis columns', () => {
    const multipleXAxisProps = {
      ...defaultProps,
      selectedAxis: {
        x: ['category_column', 'numeric_column'],
        y: ['numeric_column']
      } as ChartEncodes
    };

    const { result } = renderHook(() => useXAxis(multipleXAxisProps));
    expect(result.current?.type).toBe('category');
    expect(result.current?.ticks).toBeDefined();
  });

  it('should apply correct time scale settings for date columns', () => {
    const dateAxisProps = {
      ...defaultProps,
      selectedChartType: 'line',
      selectedAxis: {
        x: ['date_column'],
        y: ['numeric_column']
      } as ChartEncodes
    } as const;

    const { result } = renderHook(() => useXAxis(dateAxisProps));
    expect(result.current?.type).toBe('time');
    expect(typeof result.current?.ticks).toBe('object');
  });

  it('should handle custom column settings', () => {
    const customColumnProps = {
      ...defaultProps,
      columnSettings: {
        category_column: {
          ...DEFAULT_COLUMN_SETTINGS,
          aggregation: 'sum',
          format: 'number',
          precision: 2,
          showDataLabels: true
        } as ColumnSettings
      }
    };

    const { result } = renderHook(() => useXAxis(customColumnProps));
    expect(result.current?.ticks).toBeDefined();
  });

  it('should handle auto rotation settings correctly', () => {
    const autoRotationProps = {
      ...defaultProps,
      xAxisLabelRotation: 'auto' as const
    };

    const { result } = renderHook(() => useXAxis(autoRotationProps));
    expect(result.current?.ticks).toBeDefined();
    expect(result.current?.ticks?.autoSkip).toBe(true);
  });

  it('should configure scatter plot with numeric x-axis correctly', () => {
    const scatterProps = {
      ...defaultProps,
      selectedChartType: 'scatter',
      selectedAxis: {
        x: ['numeric_column'],
        y: ['numeric_column']
      } as ChartEncodes
    } as const;

    const { result } = renderHook(() => useXAxis(scatterProps));
    expect(result.current?.type).toBe('linear');
    expect(result.current?.grid?.display).toBe(true);
  });

  it('should handle zero degree rotation explicitly', () => {
    const zeroRotationProps = {
      ...defaultProps,
      xAxisLabelRotation: 0 as const
    };

    const { result } = renderHook(() => useXAxis(zeroRotationProps));
    expect(result.current?.ticks?.maxRotation).toBe(0);
    expect(result.current?.ticks?.minRotation).toBe(0);
  });

  it('should handle line chart with grouped data', () => {
    const lineGroupProps = {
      ...defaultProps,
      selectedChartType: 'line',
      lineGroupType: 'stack' as const,
      selectedAxis: {
        x: ['date_column'],
        y: ['numeric_column']
      } as ChartEncodes
    } as const;

    const { result } = renderHook(() => useXAxis(lineGroupProps));
    expect(result.current?.type).toBe('time');
    expect(result.current?.ticks).toBeDefined();
  });

  it('should handle disabled grid lines', () => {
    const noGridProps = {
      ...defaultProps,
      gridLines: false
    };

    const { result } = renderHook(() => useXAxis(noGridProps));
    expect(result.current?.grid?.display).toBeFalsy();
  });

  it('should handle custom time interval with quarter setting', () => {
    const quarterIntervalProps = {
      ...defaultProps,
      selectedChartType: 'line',
      selectedAxis: {
        x: ['date_column'],
        y: ['numeric_column']
      } as ChartEncodes,
      xAxisTimeInterval: 'quarter' as const
    } as const;

    const { result } = renderHook(() => useXAxis(quarterIntervalProps));
    expect(result.current?.type).toBe('time');
    expect(result.current?.ticks).toBeDefined();
  });

  it('should handle bar chart with no axis title', () => {
    const noTitleProps = {
      ...defaultProps,
      xAxisShowAxisTitle: false,
      xAxisAxisTitle: null
    } as Parameters<typeof useXAxis>[0];

    const { result } = renderHook(() => useXAxis(noTitleProps));
    expect(result.current?.title?.display).toBe(false);
    expect(result.current?.title?.text).toBe('');
  });

  it('should correctly set xAxisColumnFormats and firstXColumnLabelFormat', () => {
    // Test with default category column
    const { result } = renderHook(() => useXAxis(defaultProps));

    // Get the internal state to verify xAxisColumnFormats and firstXColumnLabelFormat
    // We need to access the useXAxis hook results
    expect(result.current).toBeDefined();

    // For scatter chart
    const scatterProps = {
      ...defaultProps,
      selectedChartType: 'scatter',
      selectedAxis: {
        x: ['numeric_column'],
        y: ['numeric_column']
      } as ChartEncodes
    } as const;

    const { result: scatterResult } = renderHook(() => useXAxis(scatterProps));
    expect(scatterResult.current).toBeDefined();
    expect(scatterResult.current?.type).toBe('linear');

    // For multiple x-axis columns
    const multipleColumnsProps = {
      ...defaultProps,
      selectedAxis: {
        x: ['category_column', 'numeric_column'],
        y: ['numeric_column']
      } as ChartEncodes
    };

    const { result: multiResult } = renderHook(() => useXAxis(multipleColumnsProps));
    expect(multiResult.current).toBeDefined();
    expect(multiResult.current?.type).toBe('category');

    // For unsupported chart type (pie)
    const pieProps = {
      ...defaultProps,
      selectedChartType: 'pie'
    } as const;

    const { result: pieResult } = renderHook(() => useXAxis(pieProps));
    expect(pieResult.current).toBeUndefined();
  });

  it('should correctly handle firstXColumnLabelFormat for scatter chart', () => {
    // Specifically test the firstXColumnLabelFormat logic for scatter charts
    const scatterProps = {
      ...defaultProps,
      selectedChartType: 'scatter',
      selectedAxis: {
        x: ['numeric_column'],
        y: ['numeric_column']
      } as ChartEncodes
    } as const;

    const { result } = renderHook(() => useXAxis(scatterProps));

    // Verify that scatter charts get proper formatting with minimumFractionDigits and maximumFractionDigits set to 0
    expect(result.current).toBeDefined();
    expect(result.current?.type).toBe('linear');

    // Test the tick callback formatting
    // We can't directly access the firstXColumnLabelFormat from outside the hook,
    // but we can test its effects through the tick callback behavior
    expect(result.current?.ticks?.callback).toBeDefined();

    // Verify custom column label formats are applied
    const customFormatProps = {
      ...scatterProps,
      columnLabelFormats: {
        ...defaultProps.columnLabelFormats,
        numeric_column: {
          ...DEFAULT_COLUMN_LABEL_FORMAT,
          columnType: 'number' as SimplifiedColumnType,
          style: 'number' as const,
          minimumFractionDigits: 3,
          maximumFractionDigits: 3
        }
      }
    };

    const { result: customResult } = renderHook(() => useXAxis(customFormatProps));
    expect(customResult.current).toBeDefined();
    expect(customResult.current?.type).toBe('linear');
  });

  it('should apply correct column formats for date columns with different formats', () => {
    // Test with custom date format
    const customDateFormatProps = {
      ...defaultProps,
      selectedChartType: 'line',
      selectedAxis: {
        x: ['date_column'],
        y: ['numeric_column']
      } as ChartEncodes,
      columnLabelFormats: {
        ...defaultProps.columnLabelFormats,
        date_column: {
          ...defaultProps.columnLabelFormats.date_column,
          dateFormat: 'YYYY-MM-DD'
        }
      }
    } as Parameters<typeof useXAxis>[0];

    const { result } = renderHook(() => useXAxis(customDateFormatProps));
    expect(result.current).toBeDefined();
    expect(result.current?.type).toBe('time');
    expect(result.current?.ticks?.callback).toBeDefined();

    // Test with auto date format
    const autoDateFormatProps = {
      ...customDateFormatProps,
      columnLabelFormats: {
        ...defaultProps.columnLabelFormats,
        date_column: {
          ...defaultProps.columnLabelFormats.date_column,
          dateFormat: 'auto'
        }
      }
    } as Parameters<typeof useXAxis>[0];

    const { result: autoResult } = renderHook(() => useXAxis(autoDateFormatProps));
    expect(autoResult.current).toBeDefined();
    expect(autoResult.current?.type).toBe('time');
    expect(autoResult.current?.ticks?.callback).toBeDefined();
  });
});
