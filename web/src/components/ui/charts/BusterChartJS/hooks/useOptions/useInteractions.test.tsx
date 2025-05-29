import type { BusterChartConfigProps, ChartType } from '@/api/asset_interfaces/metric/charts';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useInteractions } from './useInteractions';

describe('useInteractions', () => {
  it('should return correct interactions for scatter chart', () => {
    const { result } = renderHook(() =>
      useInteractions({
        selectedChartType: 'scatter' as ChartType,
        barLayout: 'vertical' as BusterChartConfigProps['barLayout']
      })
    );

    expect(result.current).toEqual({
      intersect: true,
      axis: 'xy',
      mode: 'nearest',
      includeInvisible: false
    });
  });
  it('should return correct interactions for vertical bar chart', () => {
    const { result } = renderHook(() =>
      useInteractions({
        selectedChartType: 'bar' as ChartType,
        barLayout: 'vertical' as BusterChartConfigProps['barLayout']
      })
    );

    expect(result.current).toEqual({
      intersect: false,
      mode: 'index',
      includeInvisible: false,
      axis: 'x'
    });
  });
  it('should return correct interactions for horizontal bar chart', () => {
    const { result } = renderHook(() =>
      useInteractions({
        selectedChartType: 'bar' as ChartType,
        barLayout: 'horizontal' as BusterChartConfigProps['barLayout']
      })
    );

    expect(result.current).toEqual({
      intersect: false,
      mode: 'index',
      includeInvisible: false,
      axis: 'y'
    });
  });
  it('should return correct interactions for line chart', () => {
    const { result } = renderHook(() =>
      useInteractions({
        selectedChartType: 'line' as ChartType,
        barLayout: 'vertical' as BusterChartConfigProps['barLayout']
      })
    );

    expect(result.current).toEqual({
      intersect: false,
      mode: 'index',
      includeInvisible: false,
      axis: 'x'
    });
  });
  it('should return correct interactions for combo chart', () => {
    const { result } = renderHook(() =>
      useInteractions({
        selectedChartType: 'combo' as ChartType,
        barLayout: 'vertical' as BusterChartConfigProps['barLayout']
      })
    );

    expect(result.current).toEqual({
      intersect: false,
      mode: 'nearest',
      includeInvisible: false,
      axis: 'x'
    });
  });
  it('should return undefined for other chart types', () => {
    const { result } = renderHook(() =>
      useInteractions({
        selectedChartType: 'pie' as ChartType,
        barLayout: 'vertical' as BusterChartConfigProps['barLayout']
      })
    );

    expect(result.current).toBeUndefined();
  });
  it('should memoize the result and not recalculate on rerenders with same props', () => {
    const props = {
      selectedChartType: 'bar' as ChartType,
      barLayout: 'vertical' as BusterChartConfigProps['barLayout']
    };

    const { result, rerender } = renderHook(() => useInteractions(props));
    const firstResult = result.current;

    // Rerender with the same props
    rerender();

    // Result should be the same object reference (memoized)
    expect(result.current).toBe(firstResult);
  });
  it('should recalculate when props change', () => {
    const { result, rerender } = renderHook((props) => useInteractions(props), {
      initialProps: {
        selectedChartType: 'bar' as ChartType,
        barLayout: 'vertical' as BusterChartConfigProps['barLayout']
      }
    });

    const firstResult = result.current;

    // Rerender with different props
    rerender({
      selectedChartType: 'scatter' as ChartType,
      barLayout: 'vertical' as BusterChartConfigProps['barLayout']
    });

    // Result should be a different object
    expect(result.current).not.toBe(firstResult);
    expect(result.current).toEqual({
      intersect: true,
      axis: 'xy',
      mode: 'nearest',
      includeInvisible: false
    });
  });
});
