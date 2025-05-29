import { Chart, ChartData, ChartType } from 'chart.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChartMountedPlugin, ChartMountedPluginOptions } from './chartjs-plugin-mounted';

// Mock Chart.js
vi.mock('chart.js');

describe('ChartMountedPlugin', () => {
  let mockChart: Partial<Chart>;
  let mockOptions: ChartMountedPluginOptions;

  beforeEach(() => {
    // Reset mocks before each test
    mockChart = {
      data: {
        labels: ['label1', 'label2'],
        datasets: []
      } as ChartData<ChartType>,
      $mountedPlugin: false
    };

    mockOptions = {
      onMounted: vi.fn(),
      onInitialAnimationEnd: vi.fn()
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('afterInit', () => {
    it('should call onMounted and set $mountedPlugin to true', () => {
      ChartMountedPlugin.afterInit!(mockChart as Chart, null as any, mockOptions);

      expect(mockOptions.onMounted).toHaveBeenCalledWith(mockChart);
      expect(mockChart.$mountedPlugin).toBe(true);
    });

    it('should not call onMounted when chart is undefined', () => {
      ChartMountedPlugin.afterInit!(undefined as unknown as Chart, null as any, mockOptions);

      expect(mockOptions.onMounted).not.toHaveBeenCalled();
    });

    it('should not call onMounted when options is undefined', () => {
      ChartMountedPlugin.afterInit!(
        mockChart as Chart,
        null as any,
        null as unknown as ChartMountedPluginOptions
      );

      expect(mockOptions.onMounted).not.toHaveBeenCalled();
    });
  });

  describe('afterRender', () => {
    it('should not call onInitialAnimationEnd if $mountedPlugin is true', () => {
      mockChart.$mountedPlugin = true;

      ChartMountedPlugin.afterRender!(mockChart as Chart, null as any, mockOptions);

      expect(mockOptions.onInitialAnimationEnd).not.toHaveBeenCalled();
    });

    it('should call onInitialAnimationEnd if chart has labels and plugin not mounted', () => {
      ChartMountedPlugin.afterRender!(mockChart as Chart, null as any, mockOptions);

      expect(mockOptions.onInitialAnimationEnd).toHaveBeenCalledWith(mockChart);
      expect(mockChart.$mountedPlugin).toBe(true);
    });

    it('should not call onInitialAnimationEnd if chart has no labels', () => {
      mockChart.data!.labels = [];

      ChartMountedPlugin.afterRender!(mockChart as Chart, null as any, mockOptions);

      expect(mockOptions.onInitialAnimationEnd).not.toHaveBeenCalled();
      expect(mockChart.$mountedPlugin).toBe(false);
    });
  });

  describe('defaults', () => {
    it('should have default empty functions', () => {
      expect(typeof ChartMountedPlugin.defaults?.onMounted).toBe('function');
      expect(typeof ChartMountedPlugin.defaults?.onInitialAnimationEnd).toBe('function');

      // Call default functions to ensure they don't throw
      expect(() => ChartMountedPlugin.defaults?.onMounted?.(mockChart as Chart)).not.toThrow();
      expect(() =>
        ChartMountedPlugin.defaults?.onInitialAnimationEnd?.(mockChart as Chart)
      ).not.toThrow();
    });
  });
});
