import { type ChartEncodes, DEFAULT_COLUMN_LABEL_FORMAT } from '@buster/server-shared/metrics';
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
});
