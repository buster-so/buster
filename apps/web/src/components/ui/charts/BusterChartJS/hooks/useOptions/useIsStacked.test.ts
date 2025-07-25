import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useIsStacked } from './useIsStacked';

describe('useIsStacked', () => {
  it('should return true for Line chart with percentage-stack lineGroupType', () => {
    const { result } = renderHook(() =>
      useIsStacked({
        selectedChartType: 'line',
        lineGroupType: 'percentage-stack',
        barGroupType: null
      })
    );

    expect(result.current).toBe(true);
  });

  it('should return true for Line chart with stack lineGroupType', () => {
    const { result } = renderHook(() =>
      useIsStacked({
        selectedChartType: 'line',
        lineGroupType: 'stack',
        barGroupType: null
      })
    );

    expect(result.current).toBe(true);
  });

  it('should return false for Line chart with null lineGroupType', () => {
    const { result } = renderHook(() =>
      useIsStacked({
        selectedChartType: 'line',
        lineGroupType: null,
        barGroupType: 'stack'
      })
    );

    expect(result.current).toBe(false);
  });

  it('should return true for Bar chart with percentage-stack barGroupType', () => {
    const { result } = renderHook(() =>
      useIsStacked({
        selectedChartType: 'bar',
        lineGroupType: null,
        barGroupType: 'percentage-stack'
      })
    );

    expect(result.current).toBe(true);
  });

  it('should return true for Bar chart with stack barGroupType', () => {
    const { result } = renderHook(() =>
      useIsStacked({
        selectedChartType: 'bar',
        lineGroupType: null,
        barGroupType: 'stack'
      })
    );

    expect(result.current).toBe(true);
  });

  it('should return false for Bar chart with group barGroupType', () => {
    const { result } = renderHook(() =>
      useIsStacked({
        selectedChartType: 'bar',
        lineGroupType: null,
        barGroupType: 'group'
      })
    );

    expect(result.current).toBe(false);
  });

  it('should return false for other chart types', () => {
    const { result } = renderHook(() =>
      useIsStacked({
        selectedChartType: 'pie',
        lineGroupType: null,
        barGroupType: 'stack'
      })
    );

    expect(result.current).toBe(false);
  });

  it('should recalculate when dependencies change', () => {
    // Initial render with no stacking
    const { result, rerender } = renderHook(() =>
      useIsStacked({
        selectedChartType: 'line',
        lineGroupType: null,
        barGroupType: null
      })
    );

    expect(result.current).toBe(false);

    // Rerender with stacked line
    rerender();
    const newHook = renderHook(() =>
      useIsStacked({
        selectedChartType: 'line',
        lineGroupType: 'stack',
        barGroupType: null
      })
    );

    expect(newHook.result.current).toBe(true);
  });
});
