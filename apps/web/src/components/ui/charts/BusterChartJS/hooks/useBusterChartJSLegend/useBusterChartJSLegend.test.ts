import type { ChartEncodes, ChartType, ColumnSettings } from '@buster/server-shared/metrics';
import { act, renderHook } from '@testing-library/react';
import type { Chart } from 'chart.js';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { BusterChartProps } from '../../../BusterChart.types';
import type { BusterChartLegendItem } from '../../../BusterChartLegend';
import type { DatasetOptionsWithTicks } from '../../../chartHooks';
import type { ChartJSOrUndefined } from '../../core/types';
import { useBusterChartJSLegend } from './useBusterChartJSLegend';

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 0);
  return 1;
});

// Mock the dependencies
vi.mock('../../../BusterChartLegend', () => ({
  useBusterChartLegend: vi.fn(),
  addLegendHeadlines: vi.fn(),
}));

vi.mock('./getLegendItems', () => ({
  getLegendItems: vi.fn(),
}));

vi.mock('@/hooks/useDebounce', () => ({
  useDebounceFn: vi.fn(),
}));

vi.mock('@/hooks/useMemoizedFn', () => ({
  useMemoizedFn: vi.fn((fn) => fn),
}));

vi.mock('@/hooks/useUpdateDebounceEffect', () => ({
  useUpdateDebounceEffect: vi.fn(),
}));

vi.mock('@/lib/timeout', () => ({
  timeout: vi.fn(),
}));

describe('useBusterChartJSLegend', () => {
  let mockChartRef: React.RefObject<ChartJSOrUndefined>;
  let mockChart: Partial<Chart>;
  let mockUseBusterChartLegend: Mock;
  let mockGetLegendItems: Mock;
  let mockUseDebounceFn: Mock;
  let mockTimeout: Mock;

  const defaultProps = {
    colors: ['#FF0000', '#00FF00', '#0000FF'],
    showLegend: true,
    selectedChartType: 'bar' as ChartType,
    chartMounted: true,
    selectedAxis: undefined as ChartEncodes | undefined,
    showLegendHeadline: undefined,
    columnLabelFormats: {},
    loading: false,
    lineGroupType: null as 'stack' | 'percentage-stack' | null,
    barGroupType: null as 'stack' | 'percentage-stack' | null,
    datasetOptions: {} as DatasetOptionsWithTicks,
    columnSettings: {} as NonNullable<BusterChartProps['columnSettings']>,
    columnMetadata: [],
    pieMinimumSlicePercentage: 5,
    numberOfDataPoints: 100,
    animateLegend: true,
  };

  const mockLegendData = {
    inactiveDatasets: {},
    setInactiveDatasets: vi.fn(),
    legendItems: [] as BusterChartLegendItem[],
    setLegendItems: vi.fn(),
    renderLegend: true,
    isStackPercentage: false,
    showLegend: true,
    allYAxisColumnNames: [],
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockChart = {
      data: {
        datasets: [
          {
            label: 'Dataset 1',
            data: [10, 20, 30],
            hidden: false,
            tooltipData: [],
            xAxisKeys: [],
            yAxisKey: 'y1',
          },
          {
            label: 'Dataset 2',
            data: [15, 25, 35],
            hidden: false,
            tooltipData: [],
            xAxisKeys: [],
            yAxisKey: 'y2',
          },
        ],
        labels: ['A', 'B', 'C'],
      },
      options: {
        animation: {},
      },
      update: vi.fn(),
      getDatasetMeta: vi.fn(
        () =>
          ({
            type: 'bar',
            controller: {} as any,
            order: 0,
            label: 'test',
            data: [{}, {}, {}],
            dataset: {} as any,
            stack: null,
            index: 0,
            visible: true,
            hidden: false,
            parsed: [],
            normalized: false,
            sorting: { start: 0, count: 3 },
            _sorted: true,
            _stacked: false,
            _stack: null,
            _meta: {},
            indexAxis: 'x' as any,
            iAxisID: 'x',
            vAxisID: 'y',
            _parsed: [],
            _clip: false,
          }) as any
      ),
      setActiveElements: vi.fn(),
      getActiveElements: vi.fn(() => []),
      toggleDataVisibility: vi.fn(),
      setDatasetVisibility: vi.fn(),
      isDatasetVisible: vi.fn(() => true),
    };

    mockChartRef = {
      current: mockChart as Chart,
    };

    mockUseBusterChartLegend = vi.fn(() => mockLegendData);
    mockGetLegendItems = vi.fn(() => []);
    mockUseDebounceFn = vi.fn(() => ({ run: vi.fn() }));
    mockTimeout = vi.fn(() => Promise.resolve());

    const { useBusterChartLegend: mockUseBusterChartLegendImport } = await import(
      '../../../BusterChartLegend'
    );
    const { getLegendItems: mockGetLegendItemsImport } = await import('./getLegendItems');
    const { useDebounceFn: mockUseDebounceFnImport } = await import('@/hooks/useDebounce');
    const { timeout: mockTimeoutImport } = await import('@/lib/timeout');

    (mockUseBusterChartLegendImport as Mock).mockImplementation(mockUseBusterChartLegend);
    (mockGetLegendItemsImport as Mock).mockImplementation(mockGetLegendItems);
    (mockUseDebounceFnImport as Mock).mockImplementation(mockUseDebounceFn);
    (mockTimeoutImport as Mock).mockImplementation(mockTimeout);
  });

  it('should return expected values from hook', () => {
    const { result } = renderHook(() =>
      useBusterChartJSLegend({
        chartRef: mockChartRef,
        ...defaultProps,
      })
    );

    expect(result.current).toEqual({
      renderLegend: true,
      legendItems: [],
      onHoverItem: expect.any(Function),
      onLegendItemClick: expect.any(Function),
      onLegendItemFocus: expect.any(Function),
      showLegend: true,
      inactiveDatasets: {},
      isUpdatingChart: false,
      animateLegend: true,
    });
  });

  it('should not return onLegendItemFocus for pie charts', () => {
    const { result } = renderHook(() =>
      useBusterChartJSLegend({
        chartRef: mockChartRef,
        ...defaultProps,
        selectedChartType: 'pie',
      })
    );

    expect(result.current.onLegendItemFocus).toBeUndefined();
  });

  it('should disable animation for large datasets', () => {
    const { result } = renderHook(() =>
      useBusterChartJSLegend({
        chartRef: mockChartRef,
        ...defaultProps,
        numberOfDataPoints: 300, // Above LEGEND_ANIMATION_THRESHOLD (250)
      })
    );

    expect(result.current.animateLegend).toBe(false);
  });

  it('should enable animation for small datasets when animateLegend is true', () => {
    const { result } = renderHook(() =>
      useBusterChartJSLegend({
        chartRef: mockChartRef,
        ...defaultProps,
        numberOfDataPoints: 200, // Below LEGEND_ANIMATION_THRESHOLD (250)
        animateLegend: true,
      })
    );

    expect(result.current.animateLegend).toBe(true);
  });

  it('should handle onHoverItem correctly', () => {
    const { result } = renderHook(() =>
      useBusterChartJSLegend({
        chartRef: mockChartRef,
        ...defaultProps,
      })
    );

    const mockItem: BusterChartLegendItem = {
      id: 'Dataset 1',
      color: '#FF0000',
      inactive: false,
      type: 'bar',
      formattedName: 'Dataset 1',
      data: [10, 20, 30],
      yAxisKey: 'y',
    };

    act(() => {
      result.current.onHoverItem(mockItem, true);
    });

    expect(mockChart.setActiveElements).toHaveBeenCalled();
    expect(mockChart.update).toHaveBeenCalled();
  });

  it('should handle onLegendItemClick for non-pie charts', async () => {
    const mockSetInactiveDatasets = vi.fn();
    const mockDebouncedUpdate = vi.fn();

    mockUseBusterChartLegend.mockReturnValue({
      ...mockLegendData,
      setInactiveDatasets: mockSetInactiveDatasets,
    });

    mockUseDebounceFn.mockReturnValue({ run: mockDebouncedUpdate });

    const { result } = renderHook(() =>
      useBusterChartJSLegend({
        chartRef: mockChartRef,
        ...defaultProps,
        selectedChartType: 'bar',
      })
    );

    const mockItem: BusterChartLegendItem = {
      id: 'Dataset 1',
      color: '#FF0000',
      inactive: false,
      type: 'bar',
      formattedName: 'Dataset 1',
      data: [10, 20, 30],
      yAxisKey: 'y',
    };

    await act(async () => {
      await result.current.onLegendItemClick(mockItem);
      // Wait for requestAnimationFrame
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(mockSetInactiveDatasets).toHaveBeenCalledWith(expect.any(Function));
    expect(mockChart.setDatasetVisibility).toHaveBeenCalled();
    expect(mockDebouncedUpdate).toHaveBeenCalled();
  });

  it('should handle onLegendItemClick for pie charts', async () => {
    const mockSetInactiveDatasets = vi.fn();
    const mockDebouncedUpdate = vi.fn();

    // Set up pie chart data structure
    mockChart.data = {
      datasets: [
        {
          label: 'Dataset 1',
          data: [10, 20, 30],
          hidden: false,
          tooltipData: [],
          xAxisKeys: [],
          yAxisKey: 'y1',
        },
      ],
      labels: ['Category A', 'Category B', 'Category C'],
    };

    mockUseBusterChartLegend.mockReturnValue({
      ...mockLegendData,
      setInactiveDatasets: mockSetInactiveDatasets,
    });

    mockUseDebounceFn.mockReturnValue({ run: mockDebouncedUpdate });

    const { result } = renderHook(() =>
      useBusterChartJSLegend({
        chartRef: mockChartRef,
        ...defaultProps,
        selectedChartType: 'pie',
      })
    );

    const mockItem: BusterChartLegendItem = {
      id: 'Category A',
      color: '#FF0000',
      inactive: false,
      type: 'pie',
      formattedName: 'Category A',
      data: [10, 20, 30],
      yAxisKey: 'y',
    };

    await act(async () => {
      await result.current.onLegendItemClick(mockItem);
      // Wait for requestAnimationFrame
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(mockSetInactiveDatasets).toHaveBeenCalledWith(expect.any(Function));
    expect(mockChart.toggleDataVisibility).toHaveBeenCalled();
    expect(mockDebouncedUpdate).toHaveBeenCalled();
  });

  it('should handle onLegendItemFocus correctly', async () => {
    const mockSetInactiveDatasets = vi.fn();
    const mockDebouncedUpdate = vi.fn();

    mockChart.isDatasetVisible = vi.fn(() => true);

    mockUseBusterChartLegend.mockReturnValue({
      ...mockLegendData,
      setInactiveDatasets: mockSetInactiveDatasets,
    });

    mockUseDebounceFn.mockReturnValue({ run: mockDebouncedUpdate });

    const { result } = renderHook(() =>
      useBusterChartJSLegend({
        chartRef: mockChartRef,
        ...defaultProps,
        selectedChartType: 'bar',
      })
    );

    const mockItem: BusterChartLegendItem = {
      id: 'Dataset 1',
      color: '#FF0000',
      inactive: false,
      type: 'bar',
      formattedName: 'Dataset 1',
      data: [10, 20, 30],
      yAxisKey: 'y',
    };

    if (result.current.onLegendItemFocus) {
      await act(async () => {
        await result.current.onLegendItemFocus!(mockItem);
        // Wait for requestAnimationFrame
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockSetInactiveDatasets).toHaveBeenCalled();
      expect(mockDebouncedUpdate).toHaveBeenCalled();
    }
  });

  it('should return early when chart is not mounted', () => {
    mockGetLegendItems.mockClear();

    renderHook(() =>
      useBusterChartJSLegend({
        chartRef: mockChartRef,
        ...defaultProps,
        chartMounted: false,
      })
    );

    // Wait for effects to run
    expect(mockGetLegendItems).not.toHaveBeenCalled();
  });

  it('should return early when showLegend is false', () => {
    mockUseBusterChartLegend.mockReturnValue({
      ...mockLegendData,
      showLegend: false,
    });

    mockGetLegendItems.mockClear();

    renderHook(() =>
      useBusterChartJSLegend({
        chartRef: mockChartRef,
        ...defaultProps,
        showLegend: false,
      })
    );

    // Wait for effects to run
    expect(mockGetLegendItems).not.toHaveBeenCalled();
  });

  it('should handle null chart reference gracefully in event handlers', () => {
    const nullChartRef = { current: null };

    const { result } = renderHook(() =>
      useBusterChartJSLegend({
        chartRef: nullChartRef,
        ...defaultProps,
      })
    );

    const mockItem: BusterChartLegendItem = {
      id: 'Dataset 1',
      color: '#FF0000',
      inactive: false,
      type: 'bar',
      formattedName: 'Dataset 1',
      data: [10, 20, 30],
      yAxisKey: 'y',
    };

    // These should not throw errors
    expect(() => {
      result.current.onHoverItem(mockItem, true);
    }).not.toThrow();

    expect(() => {
      result.current.onLegendItemClick(mockItem);
    }).not.toThrow();

    if (result.current.onLegendItemFocus) {
      expect(() => {
        result.current.onLegendItemFocus!(mockItem);
      }).not.toThrow();
    }
  });

  it('should handle chart with disabled animations', () => {
    mockChart.options = { animation: false };

    const { result } = renderHook(() =>
      useBusterChartJSLegend({
        chartRef: mockChartRef,
        ...defaultProps,
      })
    );

    const mockItem: BusterChartLegendItem = {
      id: 'Dataset 1',
      color: '#FF0000',
      inactive: false,
      type: 'bar',
      formattedName: 'Dataset 1',
      data: [10, 20, 30],
      yAxisKey: 'y',
    };

    act(() => {
      result.current.onHoverItem(mockItem, true);
    });

    // Should not call setActiveElements when animations are disabled
    expect(mockChart.setActiveElements).not.toHaveBeenCalled();
  });

  it('should set isUpdatingChart state for large datasets during interactions', async () => {
    const { result } = renderHook(() =>
      useBusterChartJSLegend({
        chartRef: mockChartRef,
        ...defaultProps,
        numberOfDataPoints: 300, // Large dataset (above 250 threshold)
      })
    );

    const mockItem: BusterChartLegendItem = {
      id: 'Dataset 1',
      color: '#FF0000',
      inactive: false,
      type: 'bar',
      formattedName: 'Dataset 1',
      data: [10, 20, 30],
      yAxisKey: 'y',
    };

    expect(result.current.isUpdatingChart).toBe(false);

    await act(async () => {
      await result.current.onLegendItemClick(mockItem);
    });

    // For large datasets, isUpdatingChart should be set to true during the operation
    expect(mockTimeout).toHaveBeenCalledWith(95); // DELAY_DURATION_FOR_LARGE_DATASET
  });

  it('should call getLegendItems with correct parameters', async () => {
    const mockLegendItems = [
      {
        id: 'test',
        color: '#FF0000',
        inactive: false,
        type: 'bar' as ChartType,
        formattedName: 'Test',
        data: [1, 2, 3],
        yAxisKey: 'y',
      },
    ];

    mockGetLegendItems.mockReturnValue(mockLegendItems);

    renderHook(() =>
      useBusterChartJSLegend({
        chartRef: mockChartRef,
        ...defaultProps,
      })
    );

    // Wait for effects to run and requestAnimationFrame
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(mockGetLegendItems).toHaveBeenCalledWith({
      chartRef: mockChartRef,
      colors: defaultProps.colors,
      inactiveDatasets: {},
      selectedChartType: 'bar',
      columnLabelFormats: defaultProps.columnLabelFormats,
      columnSettings: defaultProps.columnSettings,
    });
  });

  it('should handle focus behavior when all other datasets are already hidden', async () => {
    const mockSetInactiveDatasets = vi.fn();
    const mockDebouncedUpdate = vi.fn();

    // Mock scenario where we have multiple visible datasets and one is being focused
    mockChart.isDatasetVisible = vi.fn((index) => index === 1); // Only second dataset is visible
    mockChart.data = {
      datasets: [
        {
          label: 'Active Dataset',
          data: [10, 20, 30],
          hidden: false,
          tooltipData: [],
          xAxisKeys: [],
          yAxisKey: 'y1',
        },
        {
          label: 'Another Dataset',
          data: [15, 25, 35],
          hidden: false,
          tooltipData: [],
          xAxisKeys: [],
          yAxisKey: 'y2',
        },
      ],
      labels: ['A', 'B', 'C'],
    };

    mockUseBusterChartLegend.mockReturnValue({
      ...mockLegendData,
      setInactiveDatasets: mockSetInactiveDatasets,
    });

    mockUseDebounceFn.mockReturnValue({ run: mockDebouncedUpdate });

    const { result } = renderHook(() =>
      useBusterChartJSLegend({
        chartRef: mockChartRef,
        ...defaultProps,
        selectedChartType: 'bar',
      })
    );

    const mockItem: BusterChartLegendItem = {
      id: 'Active Dataset',
      color: '#FF0000',
      inactive: false,
      type: 'bar',
      formattedName: 'Active Dataset',
      data: [10, 20, 30],
      yAxisKey: 'y',
    };

    if (result.current.onLegendItemFocus) {
      await act(async () => {
        await result.current.onLegendItemFocus!(mockItem);
        // Wait for requestAnimationFrame
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // When focusing on a dataset, it should show only that dataset
      expect(mockChart.setDatasetVisibility).toHaveBeenCalledWith(0, true);
      expect(mockChart.setDatasetVisibility).toHaveBeenCalledWith(1, false);
    }
  });
});
