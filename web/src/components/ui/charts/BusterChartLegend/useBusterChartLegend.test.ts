import { ChartType } from '@/api/asset_interfaces/metric/charts/enum';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it } from 'vitest';
import { BusterChartLegendItem } from './interfaces';
import { useBusterChartLegend } from './useBusterChartLegend';

describe('useBusterChartLegend', () => {
  const defaultProps = {
    selectedChartType: ChartType.Line,
    showLegendProp: true,
    loading: false,
    lineGroupType: 'percentage-stack' as const,
    barGroupType: 'percentage-stack' as const,
    selectedAxis: {
      x: ['timestamp'],
      y: ['value1', 'value2'],
      y2: ['value3']
    }
  };

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBusterChartLegend(defaultProps));

    expect(result.current.inactiveDatasets).toEqual({});
    expect(result.current.legendItems).toEqual([]);
    expect(result.current.renderLegend).toBe(true);
    expect(result.current.isStackPercentage).toBe(true);
    expect(result.current.showLegend).toBe(true);
    expect(result.current.allYAxisColumnNames).toEqual(['value1', 'value2', 'value3']);
  });

  it('should not render legend for metric chart type', () => {
    const props = {
      ...defaultProps,
      selectedChartType: ChartType.Metric
    };

    const { result } = renderHook(() => useBusterChartLegend(props));
    expect(result.current.renderLegend).toBe(false);
  });

  it('should detect percentage stack type for line chart', () => {
    const props = {
      ...defaultProps,
      lineGroupType: 'percentage-stack' as const
    };

    const { result } = renderHook(() => useBusterChartLegend(props));
    expect(result.current.isStackPercentage).toBe(true);
  });

  it('should detect percentage stack type for bar chart', () => {
    const props = {
      ...defaultProps,
      selectedChartType: ChartType.Bar,
      barGroupType: 'percentage-stack' as const
    };

    const { result } = renderHook(() => useBusterChartLegend(props));
    expect(result.current.isStackPercentage).toBe(true);
  });

  it('should update inactiveDatasets', () => {
    const { result } = renderHook(() => useBusterChartLegend(defaultProps));

    act(() => {
      result.current.setInactiveDatasets({ value1: true });
    });

    expect(result.current.inactiveDatasets).toEqual({ value1: true });
  });

  it('should update legendItems', () => {
    const { result } = renderHook(() => useBusterChartLegend(defaultProps));
    const newLegendItems: BusterChartLegendItem[] = [
      {
        color: '#000',
        inactive: false,
        type: ChartType.Line,
        data: [1, 2, 3],
        formattedName: 'Test Series',
        id: 'test-1',
        yAxisKey: 'y',
        serieName: 'Test'
      }
    ];

    act(() => {
      result.current.setLegendItems(newLegendItems);
    });

    expect(result.current.legendItems).toEqual(newLegendItems);
  });

  it('should reset inactiveDatasets when axis changes', () => {
    const { result, rerender } = renderHook((props) => useBusterChartLegend(props), {
      initialProps: defaultProps
    });

    act(() => {
      result.current.setInactiveDatasets({ value1: true });
    });

    const newProps = {
      ...defaultProps,
      selectedAxis: {
        ...defaultProps.selectedAxis,
        y: ['newValue1', 'newValue2']
      }
    };

    rerender(newProps);

    expect(result.current.inactiveDatasets).toEqual({});
  });
});
