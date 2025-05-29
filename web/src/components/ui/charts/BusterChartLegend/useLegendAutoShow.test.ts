import type { BusterChartProps } from '@/api/asset_interfaces/metric/charts';
import { renderHook } from '@testing-library/react';
import { useLegendAutoShow } from './useLegendAutoShow';

type ChartType = BusterChartProps['selectedChartType'];

describe('useLegendAutoShow', () => {
  const defaultProps = {
    selectedChartType: 'line' as ChartType,
    showLegendProp: undefined,
    categoryAxisColumnNames: undefined,
    allYAxisColumnNames: [] as string[]
  };

  it('should return false for unsupported chart types', () => {
    const { result } = renderHook(() =>
      useLegendAutoShow({
        ...defaultProps,
        selectedChartType: 'metric' as ChartType
      })
    );
    expect(result.current).toBe(false);

    const { result: tableResult } = renderHook(() =>
      useLegendAutoShow({
        ...defaultProps,
        selectedChartType: 'table' as ChartType
      })
    );
    expect(tableResult.current).toBe(false);
  });

  it('should respect showLegendProp when it is explicitly set', () => {
    const { result: trueResult } = renderHook(() =>
      useLegendAutoShow({
        ...defaultProps,
        showLegendProp: true
      })
    );
    expect(trueResult.current).toBe(true);

    const { result: falseResult } = renderHook(() =>
      useLegendAutoShow({
        ...defaultProps,
        showLegendProp: false
      })
    );
    expect(falseResult.current).toBe(false);
  });

  it('should show legend for scatter charts with axis data', () => {
    const { result } = renderHook(() =>
      useLegendAutoShow({
        ...defaultProps,
        selectedChartType: 'scatter' as ChartType,
        categoryAxisColumnNames: ['category1'],
        allYAxisColumnNames: ['y1']
      })
    );
    expect(result.current).toBe(true);
  });

  it('should show legend when multiple Y axis columns exist', () => {
    const { result } = renderHook(() =>
      useLegendAutoShow({
        ...defaultProps,
        allYAxisColumnNames: ['y1', 'y2']
      })
    );
    expect(result.current).toBe(true);
  });

  it('should show legend for pie charts', () => {
    const { result } = renderHook(() =>
      useLegendAutoShow({
        ...defaultProps,
        selectedChartType: 'pie' as ChartType
      })
    );
    expect(result.current).toBe(true);
  });

  it('should show legend for combo charts', () => {
    const { result } = renderHook(() =>
      useLegendAutoShow({
        ...defaultProps,
        selectedChartType: 'combo' as ChartType
      })
    );
    expect(result.current).toBe(true);
  });

  it('should show legend when category axis columns exist', () => {
    const { result } = renderHook(() =>
      useLegendAutoShow({
        ...defaultProps,
        categoryAxisColumnNames: ['category1']
      })
    );
    expect(result.current).toBe(true);
  });

  it('should not show legend by default when no category axis columns exist', () => {
    const { result } = renderHook(() =>
      useLegendAutoShow({
        ...defaultProps,
        categoryAxisColumnNames: []
      })
    );
    expect(result.current).toBe(false);
  });
});
