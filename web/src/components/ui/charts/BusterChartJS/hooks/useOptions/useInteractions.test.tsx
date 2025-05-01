import { renderHook } from '@testing-library/react';
import { useInteractions } from './useInteractions';
import type { ChartType, BusterChartConfigProps } from '@/api/asset_interfaces/metric/charts';

describe('useInteractions', () => {
  test('should return correct interactions for scatter chart', () => {
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

  test('should return correct interactions for vertical bar chart', () => {
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

  test('should return correct interactions for horizontal bar chart', () => {
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

  test('should return correct interactions for line chart', () => {
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

  test('should return correct interactions for combo chart', () => {
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

  test('should return undefined for other chart types', () => {
    const { result } = renderHook(() =>
      useInteractions({
        selectedChartType: 'pie' as ChartType,
        barLayout: 'vertical' as BusterChartConfigProps['barLayout']
      })
    );

    expect(result.current).toBeUndefined();
  });

  test('should memoize the result and not recalculate on rerenders with same props', () => {
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

  test('should recalculate when props change', () => {
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
