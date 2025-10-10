import {
  type ChartEncodes,
  type ColumnMetaData,
  DEFAULT_COLUMN_LABEL_FORMAT,
} from '@buster/server-shared/metrics';
import { renderHook } from '@testing-library/react';
import type { LinearScaleOptions } from 'chart.js';
import { describe, expect, it } from 'vitest';
import { useYAxis } from './useYAxis';

describe('useYAxis', () => {
  const defaultProps = {
    columnLabelFormats: {
      value1: DEFAULT_COLUMN_LABEL_FORMAT,
      value2: DEFAULT_COLUMN_LABEL_FORMAT,
    },
    selectedAxis: {
      y: ['value1'],
      x: ['date'],
      category: [],
      tooltip: null,
      colorBy: null,
    } as ChartEncodes,
    selectedChartType: 'bar',
    columnMetadata: undefined,
    barGroupType: 'group' as const,
    lineGroupType: null,
    yAxisAxisTitle: null,
    yAxisShowAxisTitle: true,
    yAxisShowAxisLabel: true,
    yAxisStartAxisAtZero: true,
    yAxisScaleType: 'linear' as const,
    gridLines: true,
    columnSettings: {},
  } as Parameters<typeof useYAxis>[0];

  it('should return undefined for pie charts', () => {
    const props = {
      ...defaultProps,
      selectedChartType: 'pie',
    } as Parameters<typeof useYAxis>[0];

    const { result } = renderHook(() => useYAxis(props));
    expect(result.current).toBeUndefined();
  });

  it('should return correct configuration for bar charts', () => {
    const { result } = renderHook(() => useYAxis(defaultProps));

    expect(result.current).toMatchObject({
      type: 'linear',
      grid: { display: true },
      beginAtZero: true,
      stacked: false,
      ticks: { display: true },
      border: { display: true },
    });
  });

  it('should handle percentage stack mode', () => {
    const props = {
      ...defaultProps,
      barGroupType: 'percentage-stack' as const,
    };

    const { result } = renderHook(() => useYAxis(props));
    expect(result.current?.max).toBe(100);
  });

  it('should handle logarithmic scale type', () => {
    const props = {
      ...defaultProps,
      yAxisScaleType: 'log' as const,
    };

    const { result } = renderHook(() => useYAxis(props));
    expect(result.current?.type).toBe('logarithmic');
  });

  it('should respect yAxisShowAxisLabel setting', () => {
    const props = {
      ...defaultProps,
      yAxisShowAxisLabel: false,
    };

    const { result } = renderHook(() => useYAxis(props));
    expect(result.current?.ticks?.display).toBe(false);
    expect(result.current?.border?.display).toBe(false);
  });

  it('should handle multiple y-axis values', () => {
    const props = {
      ...defaultProps,
      selectedAxis: {
        y: ['value1', 'value2'],
        x: ['date'],
      } as ChartEncodes,
    };

    const { result } = renderHook(() => useYAxis(props));
    expect(result.current).toBeDefined();
  });

  it('should respect yAxisStartAxisAtZero setting', () => {
    const props = {
      ...defaultProps,
      yAxisStartAxisAtZero: false,
    };

    const { result } = renderHook(() => useYAxis(props));
    expect((result.current as LinearScaleOptions)?.beginAtZero).toBe(false);
  });

  it('should handle custom axis title', () => {
    const props = {
      ...defaultProps,
      yAxisAxisTitle: 'Custom Title',
      yAxisShowAxisTitle: true,
    };

    const { result } = renderHook(() => useYAxis(props));
    expect(result.current?.title?.display).toBe(true);
    expect(result.current?.title?.text).toBe('Custom Title');
  });

  it('should handle line chart percentage stack mode', () => {
    const props = {
      ...defaultProps,
      selectedChartType: 'line',
      lineGroupType: 'percentage-stack' as const,
    } as Parameters<typeof useYAxis>[0];

    const { result } = renderHook(() => useYAxis(props));
    expect(result.current?.max).toBe(100);
  });

  describe('usePercentageModeAxis logic', () => {
    it('should return "100" for bar chart with percentage-stack', () => {
      const props = {
        ...defaultProps,
        selectedChartType: 'bar',
        barGroupType: 'percentage-stack' as const,
      } as Parameters<typeof useYAxis>[0];

      const { result } = renderHook(() => useYAxis(props));
      expect(result.current?.max).toBe(100);
      expect(result.current?.min).toBe(0);
    });

    it('should return "clamp" for columns with percent style format', () => {
      const props = {
        ...defaultProps,
        columnLabelFormats: {
          value1: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'percent' },
        },
        columnMetadata: [
          {
            name: 'value1',
            max_value: 95,
            min_value: 0,
            unique_values: 10,
            simple_type: 'number',
            type: 'float',
          } satisfies ColumnMetaData,
        ],
      } as Parameters<typeof useYAxis>[0];

      const { result } = renderHook(() => useYAxis(props));
      // With clamp mode and max_value of 95, max should be Math.max(100, 95 * 1.05) = 100
      expect(result.current?.max).toBe(100);
      expect(result.current?.min).toBe(0);
    });
  });

  describe('max value calculation logic', () => {
    it('should return 100 when usePercentageModeAxis is "100"', () => {
      const props = {
        ...defaultProps,
        barGroupType: 'percentage-stack' as const,
      } as Parameters<typeof useYAxis>[0];

      const { result } = renderHook(() => useYAxis(props));
      expect(result.current?.max).toBe(100);
    });

    it('should return Math.max(100, yMaxValue * 1.05) when usePercentageModeAxis is "clamp" and yMaxValue > 95.24', () => {
      const props = {
        ...defaultProps,
        columnLabelFormats: {
          value1: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'percent' },
        },
        columnMetadata: [
          {
            name: 'value1',
            max_value: 120,
            min_value: 0,
            unique_values: 10,
            simple_type: 'number',
            type: 'float',
          } satisfies ColumnMetaData,
        ],
      } as Parameters<typeof useYAxis>[0];

      const { result } = renderHook(() => useYAxis(props));
      // 120 * 1.05 = 126, Math.max(100, 126) = 126
      expect(result.current?.max).toBe(126);
    });

    it('should return 100 when usePercentageModeAxis is "clamp" and yMaxValue <= 95.24', () => {
      const props = {
        ...defaultProps,
        columnLabelFormats: {
          value1: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'percent' },
        },
        columnMetadata: [
          {
            name: 'value1',
            max_value: 80,
            min_value: 0,
            unique_values: 10,
            simple_type: 'number',
            type: 'float',
          } satisfies ColumnMetaData,
        ],
      } as Parameters<typeof useYAxis>[0];

      const { result } = renderHook(() => useYAxis(props));
      // 80 * 1.05 = 84, Math.max(100, 84) = 100
      expect(result.current?.max).toBe(100);
    });
  });
});
