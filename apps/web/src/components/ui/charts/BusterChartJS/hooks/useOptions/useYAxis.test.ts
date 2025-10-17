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

  describe('percentageModeMax calculation', () => {
    it('should return 100 when not in percentage mode (usePercentageModeAxis is false)', () => {
      const props = {
        ...defaultProps,
        barGroupType: 'group' as const,
        columnLabelFormats: {
          value1: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'number' },
        },
      } as Parameters<typeof useYAxis>[0];

      const { result } = renderHook(() => useYAxis(props));
      // When usePercentageModeAxis is false, percentageModeMax returns 100
      // but max is undefined (maxTickValue which is undefined in this case)
      expect(result.current?.max).toBeUndefined();
    });

    it('should return 1 when yMaxValue < 1 with percent format and multiplier 100', () => {
      const props = {
        ...defaultProps,
        columnLabelFormats: {
          value1: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'percent', multiplier: 100 },
        },
        columnMetadata: [
          {
            name: 'value1',
            max_value: 0.75,
            min_value: 0,
            unique_values: 10,
            simple_type: 'number',
            type: 'float',
          } satisfies ColumnMetaData,
        ],
      } as Parameters<typeof useYAxis>[0];

      const { result } = renderHook(() => useYAxis(props));
      // yMaxValue is 0.75 (< 1), has multiplier 100, so percentageModeMax should be 1
      // With clamp mode: Math.max(1, 0.75 * 1.05) = 1
      expect(result.current?.max).toBe(1);
    });

    it('should return 100 when yMaxValue >= 1 with percent format and multiplier 100', () => {
      const props = {
        ...defaultProps,
        columnLabelFormats: {
          value1: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'percent', multiplier: 100 },
        },
        columnMetadata: [
          {
            name: 'value1',
            max_value: 1.5,
            min_value: 0,
            unique_values: 10,
            simple_type: 'number',
            type: 'float',
          } satisfies ColumnMetaData,
        ],
      } as Parameters<typeof useYAxis>[0];

      const { result } = renderHook(() => useYAxis(props));
      // yMaxValue is 1.5 (>= 1), so percentageModeMax should be 100
      // With clamp mode: Math.max(100, 1.5 * 1.05) = 100
      expect(result.current?.max).toBe(100);
    });
  });

  describe('min and max calculation with percentage modes', () => {
    it('should use Math.min(0, yMinValue) for min when in percentage mode with negative values', () => {
      const props = {
        ...defaultProps,
        columnLabelFormats: {
          value1: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'percent' },
        },
        columnMetadata: [
          {
            name: 'value1',
            max_value: 50,
            min_value: -20,
            unique_values: 10,
            simple_type: 'number',
            type: 'float',
          } satisfies ColumnMetaData,
        ],
      } as Parameters<typeof useYAxis>[0];

      const { result } = renderHook(() => useYAxis(props));
      // yMinValue is -20, so Math.min(0, -20) = -20
      expect(result.current?.min).toBe(-20);
    });

    it('should use 0 for min when in percentage mode with positive yMinValue', () => {
      const props = {
        ...defaultProps,
        columnLabelFormats: {
          value1: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'percent' },
        },
        columnMetadata: [
          {
            name: 'value1',
            max_value: 100,
            min_value: 10,
            unique_values: 10,
            simple_type: 'number',
            type: 'float',
          } satisfies ColumnMetaData,
        ],
      } as Parameters<typeof useYAxis>[0];

      const { result } = renderHook(() => useYAxis(props));
      // yMinValue is 10, so Math.min(0, 10) = 0
      expect(result.current?.min).toBe(0);
    });

    it('should use percentageModeMax for max when usePercentageModeAxis is "100"', () => {
      const props = {
        ...defaultProps,
        barGroupType: 'percentage-stack' as const,
        columnMetadata: [
          {
            name: 'value1',
            max_value: 85,
            min_value: 0,
            unique_values: 10,
            simple_type: 'number',
            type: 'float',
          } satisfies ColumnMetaData,
        ],
      } as Parameters<typeof useYAxis>[0];

      const { result } = renderHook(() => useYAxis(props));
      // usePercentageModeAxis is "100", so max = percentageModeMax = 100
      expect(result.current?.max).toBe(100);
      expect(result.current?.min).toBe(0);
    });

    it('should use Math.max(percentageModeMax, yMaxValue * 1.05) when usePercentageModeAxis is "clamp"', () => {
      const props = {
        ...defaultProps,
        columnLabelFormats: {
          value1: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'percent' },
        },
        columnMetadata: [
          {
            name: 'value1',
            max_value: 150,
            min_value: 0,
            unique_values: 10,
            simple_type: 'number',
            type: 'float',
          } satisfies ColumnMetaData,
        ],
      } as Parameters<typeof useYAxis>[0];

      const { result } = renderHook(() => useYAxis(props));
      // usePercentageModeAxis is "clamp"
      // Math.max(100, 150 * 1.05) = Math.max(100, 157.5) = 157.5
      expect(result.current?.max).toBe(157.5);
      expect(result.current?.min).toBe(0);
    });

    it('should use minTickValue and maxTickValue when not in percentage mode', () => {
      const props = {
        ...defaultProps,
        barGroupType: 'group' as const,
        columnLabelFormats: {
          value1: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'number' },
        },
        columnMetadata: [
          {
            name: 'value1',
            max_value: 250,
            min_value: 50,
            unique_values: 10,
            simple_type: 'number',
            type: 'float',
          } satisfies ColumnMetaData,
        ],
      } as Parameters<typeof useYAxis>[0];

      const { result } = renderHook(() => useYAxis(props));
      // usePercentageModeAxis is false, so use minTickValue/maxTickValue
      // These are undefined in this test setup
      expect(result.current?.min).toBeUndefined();
      expect(result.current?.max).toBeUndefined();
    });
  });
});
