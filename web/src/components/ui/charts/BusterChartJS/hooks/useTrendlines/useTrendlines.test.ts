import { renderHook } from '@testing-library/react';
import { useTrendlines } from './useTrendlines';
import { DATASET_IDS, TrendlineDataset } from '../../../chartHooks';
import { ChartType, IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import { AnnotationOptions } from 'chartjs-plugin-annotation';

describe('useTrendlines', () => {
  const mockTrendlineDataset = (options: Partial<TrendlineDataset> = {}): TrendlineDataset => ({
    id: 'test-id',
    columnId: 'col1',
    type: 'average',
    data: [10],
    show: true,
    showTrendlineLabel: true,
    label: [{ key: 'value', value: 'Test Label' }],
    dataKey: 'test',
    axisType: 'y',
    tooltipData: [[{ key: 'value', value: 10 }]],
    trendlineLabel: null,
    ...options
  });

  const defaultProps = {
    trendlines: [] as TrendlineDataset[],
    columnLabelFormats: {} as Record<string, IColumnLabelFormat | undefined>,
    selectedChartType: 'line' as ChartType,
    lineGroupType: null
  };

  it('returns the expected structure', () => {
    const { result } = renderHook(() => useTrendlines(defaultProps));

    expect(result.current).toHaveProperty('trendlineAnnotations');
    expect(result.current).toHaveProperty('trendlineSeries');
  });

  it('handles empty trendlines array', () => {
    const { result } = renderHook(() => useTrendlines(defaultProps));

    expect(result.current.trendlineAnnotations).toEqual({});
    expect(result.current.trendlineSeries).toEqual([]);
  });

  it('supports trendlines for line charts with null lineGroupType', () => {
    const props = {
      ...defaultProps,
      trendlines: [mockTrendlineDataset()]
    };

    const { result } = renderHook(() => useTrendlines(props));

    const annotations = result.current.trendlineAnnotations as Record<
      string,
      AnnotationOptions<'line'>
    >;
    expect(annotations.average).toBeDefined();
  });

  it('does not support trendlines for line charts with percentage-stack lineGroupType', () => {
    const props = {
      ...defaultProps,
      lineGroupType: 'percentage-stack' as 'percentage-stack',
      trendlines: [mockTrendlineDataset()]
    };

    const { result } = renderHook(() => useTrendlines(props));

    expect(result.current.trendlineAnnotations).toEqual({});
  });

  it('supports trendlines for scatter charts', () => {
    const props = {
      ...defaultProps,
      selectedChartType: 'scatter' as ChartType,
      trendlines: [mockTrendlineDataset()]
    };

    const { result } = renderHook(() => useTrendlines(props));

    const annotations = result.current.trendlineAnnotations as Record<
      string,
      AnnotationOptions<'line'>
    >;
    expect(annotations.average).toBeDefined();
  });

  it('filters out trendlines with show=false', () => {
    const props = {
      ...defaultProps,
      trendlines: [mockTrendlineDataset({ show: false })]
    };

    const { result } = renderHook(() => useTrendlines(props));

    expect(result.current.trendlineAnnotations).toEqual({});
  });

  it('creates annotation trendlines correctly', () => {
    const mockColumnLabelFormat: IColumnLabelFormat = {
      columnType: 'number',
      style: 'number',
      maximumFractionDigits: 1
    };

    const props = {
      ...defaultProps,
      columnLabelFormats: { col1: mockColumnLabelFormat },
      trendlines: [mockTrendlineDataset({ trendLineColor: 'red' })]
    };

    const { result } = renderHook(() => useTrendlines(props));

    const annotations = result.current.trendlineAnnotations as Record<
      string,
      AnnotationOptions<'line'>
    >;
    expect(annotations.average).toMatchObject({
      type: 'line',
      value: 10,
      borderColor: 'red',
      borderWidth: 1.5,
      scaleID: 'y'
    });
    expect(annotations.average.label).toBeDefined();
  });

  it('creates series trendlines correctly', () => {
    const props = {
      ...defaultProps,
      trendlines: [
        mockTrendlineDataset({
          type: 'linear_regression',
          data: [5, 10, 15],
          trendLineColor: 'blue',
          equation: 'y = 2x + 1'
        })
      ]
    };

    const { result } = renderHook(() => useTrendlines(props));

    expect(result.current.trendlineSeries).toHaveLength(1);
    expect(result.current.trendlineSeries[0]).toMatchObject({
      type: 'line',
      data: [5, 10, 15],
      borderColor: 'blue',
      borderWidth: 2,
      isTrendline: true
    });
  });

  it('handles linear regression with linearSlope dataset ID', () => {
    const columnId = 'col1';
    const props = {
      ...defaultProps,
      trendlines: [
        mockTrendlineDataset({
          id: 'test-linear-slope',
          columnId,
          type: 'linear_regression',
          trendlineLabel: DATASET_IDS.linearSlope(columnId),
          data: [5, 10, 15]
        })
      ]
    };

    const { result } = renderHook(() => useTrendlines(props));

    expect(result.current.trendlineSeries).toHaveLength(1);
  });
});
