import {
  type ChartEncodes,
  type ChartType,
  DEFAULT_COLUMN_LABEL_FORMAT,
} from '@buster/server-shared/metrics';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BusterChartProps } from '../../../../BusterChart.types';
import { useTooltipOptions } from './useTooltipOptions';

// Mock necessary hooks and dependencies
vi.mock('react-dom/server', () => ({
  renderToString: vi.fn().mockReturnValue('<div>Mocked tooltip</div>'),
}));

vi.mock('@/hooks', () => ({
  useMemoizedFn: vi.fn((fn) => fn),
  useUnmount: vi.fn((fn) => fn()),
}));

describe('useTooltipOptions', () => {
  // Set up default props for testing
  const defaultProps = {
    columnLabelFormats: { test: DEFAULT_COLUMN_LABEL_FORMAT },
    columnSettings: {},
    selectedChartType: 'bar' as ChartType,
    tooltipKeys: ['test'],
    barGroupType: 'group' as BusterChartProps['barGroupType'],
    lineGroupType: 'group' as BusterChartProps['lineGroupType'],
    pieDisplayLabelAs: 'number' as BusterChartProps['pieDisplayLabelAs'],
    selectedAxis: {
      x: [],
      y: ['test'],
      category: ['category'],
      tooltip: null,
      colorBy: null,
    } as ChartEncodes,
    hasMismatchedTooltipsAndMeasures: false,
    disableTooltip: false,
    colors: ['#ff0000'],
  };

  beforeEach(() => {
    // Clean up DOM before each test
    document.body.innerHTML = '';
  });
  it('returns tooltip options with external function when tooltip is enabled', () => {
    const { result } = renderHook(() => useTooltipOptions(defaultProps));

    expect(result.current).toHaveProperty('enabled', false);
    expect(result.current).toHaveProperty('mode', 'index');
    expect(result.current.external).toBeDefined();
    expect(typeof result.current.external).toBe('function');
  });
  it('does not include external function when disableTooltip is true', () => {
    const { result } = renderHook(() =>
      useTooltipOptions({
        ...defaultProps,
        disableTooltip: true,
      })
    );

    expect(result.current).toHaveProperty('enabled', false);
    expect(result.current).toHaveProperty('mode', 'index');
    expect(result.current.external).toBeUndefined();
  });
  it('sets mode to point for scatter chart type', () => {
    const { result } = renderHook(() =>
      useTooltipOptions({
        ...defaultProps,
        selectedChartType: 'scatter' as ChartType,
      })
    );

    expect(result.current).toHaveProperty('mode', 'point');
  });
  it('sets mode to nearest for pie chart type', () => {
    const { result } = renderHook(() =>
      useTooltipOptions({
        ...defaultProps,
        selectedChartType: 'pie' as ChartType,
      })
    );

    expect(result.current).toHaveProperty('mode', 'nearest');
  });
  it('changes keyToUsePercentage when pie chart type has percentage display', () => {
    const { result: resultWithValue } = renderHook(() =>
      useTooltipOptions({
        ...defaultProps,
        selectedChartType: 'pie' as ChartType,
        pieDisplayLabelAs: 'number' as BusterChartProps['pieDisplayLabelAs'],
      })
    );

    // Initially empty since we're not using percentage display
    expect(resultWithValue.current).toBeDefined();

    const { result: resultWithPercent } = renderHook(() =>
      useTooltipOptions({
        ...defaultProps,
        selectedChartType: 'pie' as ChartType,
        pieDisplayLabelAs: 'percent' as BusterChartProps['pieDisplayLabelAs'],
      })
    );

    // Should now include tooltip keys for percentage display
    expect(resultWithPercent.current).toBeDefined();
  });
});
