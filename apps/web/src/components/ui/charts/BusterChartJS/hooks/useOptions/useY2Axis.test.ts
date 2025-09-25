import { type ComboChartAxis, DEFAULT_COLUMN_LABEL_FORMAT } from '@buster/server-shared/metrics';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useY2Axis } from './useY2Axis';

describe('useY2Axis', () => {
  const defaultProps = {
    columnLabelFormats: {
      metric1: { ...DEFAULT_COLUMN_LABEL_FORMAT },
      metric2: { ...DEFAULT_COLUMN_LABEL_FORMAT },
    },
    selectedAxis: {
      x: ['date'],
      y: ['metric1'],
      y2: ['metric2'],
    } as ComboChartAxis,
    selectedChartType: 'combo',
    y2AxisAxisTitle: 'Test Y2 Axis',
    y2AxisShowAxisTitle: true,
    y2AxisShowAxisLabel: true,
    y2AxisStartAxisAtZero: true,
    y2AxisScaleType: 'linear' as const,
    columnMetadata: [],
    columnSettings: {},
    yAxis: {
      min: undefined,
      max: undefined,
    },
  } as Parameters<typeof useY2Axis>[0];

  it('should return undefined display when chart type is not Combo', () => {
    const props = {
      ...defaultProps,
      selectedChartType: 'line',
    } as Parameters<typeof useY2Axis>[0];

    const { result } = renderHook(() => useY2Axis(props));
    expect(result.current).toEqual({ display: false });
  });

  it('should configure y2 axis correctly for Combo chart', () => {
    const { result } = renderHook(() => useY2Axis(defaultProps));

    expect(result.current).toMatchObject({
      position: 'right',
      display: true,
      title: {
        display: true,
        text: 'Test Y2 Axis',
      },
      grid: {
        drawOnChartArea: false,
      },
    });
  });

  it('should set logarithmic scale when y2AxisScaleType is log', () => {
    const props = {
      ...defaultProps,
      y2AxisScaleType: 'log' as const,
    };

    const { result } = renderHook(() => useY2Axis(props));
    expect(result.current?.type).toBe('logarithmic');
  });

  it('should hide axis when y2AxisShowAxisLabel is false', () => {
    const props = {
      ...defaultProps,
      y2AxisShowAxisLabel: false,
    };

    const { result } = renderHook(() => useY2Axis(props));
    expect(result.current?.display).toBe(false);
  });

  it('should hide title when y2AxisShowAxisTitle is false', () => {
    const props = {
      ...defaultProps,
      y2AxisShowAxisTitle: false,
    };

    const { result } = renderHook(() => useY2Axis(props));
    expect(result.current?.title?.display).toBe(false);
  });

  it('should respect y2AxisStartAxisAtZero setting', () => {
    const props = {
      ...defaultProps,
      y2AxisStartAxisAtZero: false,
    };

    const { result } = renderHook(() => useY2Axis(props));
    const options = result.current;
    expect(options).toBeDefined();
  });

  it('should handle empty y2 axis array', () => {
    const props = {
      ...defaultProps,
      selectedAxis: {
        x: ['date'],
        y: ['metric1'],
        y2: [] as string[],
      } as ComboChartAxis,
    } as Parameters<typeof useY2Axis>[0];

    const { result } = renderHook(() => useY2Axis(props));
    expect(result.current?.display).toBe(false);
  });

  it('should include tick callback function', () => {
    const { result } = renderHook(() => useY2Axis(defaultProps));
    expect(result.current?.ticks?.callback).toBeDefined();
    expect(result.current?.ticks?.autoSkip).toBe(true);
  });
});
