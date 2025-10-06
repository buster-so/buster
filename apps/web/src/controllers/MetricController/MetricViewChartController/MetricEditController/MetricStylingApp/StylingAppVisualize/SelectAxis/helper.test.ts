import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { describe, expect, it } from 'vitest';
import { SelectAxisContainerId } from './config';
import { getChartTypeDropZones } from './helper';

describe('getChartTypeDropZones', () => {
  describe('bar chart', () => {
    it('should return correct drop zones for vertical bar chart', () => {
      const mockSelectedAxis: ChartConfigProps['barAndLineAxis'] = {
        x: ['column1', 'column2'],
        y: ['value1'],
        category: ['category1'],
        tooltip: ['tooltip1', 'tooltip2'],
        colorBy: [],
      };

      const result = getChartTypeDropZones({
        chartType: 'bar',
        selectedAxis: mockSelectedAxis,
        barLayout: 'vertical',
      });

      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({
        id: SelectAxisContainerId.XAxis,
        title: 'X-Axis',
        items: ['column1', 'column2'],
      });
      expect(result[1]).toEqual({
        id: SelectAxisContainerId.YAxis,
        title: 'Y-Axis',
        items: ['value1'],
      });
      expect(result[2]).toEqual({
        id: SelectAxisContainerId.ColorBy,
        title: 'Color By',
        items: [],
      });
      expect(result[3]).toEqual({
        id: SelectAxisContainerId.CategoryAxis,
        title: 'Category',
        items: ['category1'],
      });
      expect(result[4]).toEqual({
        id: SelectAxisContainerId.Tooltip,
        title: 'Tooltip',
        items: ['tooltip1', 'tooltip2'],
      });
    });

    it('should return swapped axis drop zones for horizontal bar chart', () => {
      const mockSelectedAxis: ChartConfigProps['barAndLineAxis'] = {
        x: ['column1'],
        y: ['value1', 'value2'],
        category: ['category1'],
        tooltip: null,
        colorBy: [],
      };

      const result = getChartTypeDropZones({
        chartType: 'bar',
        selectedAxis: mockSelectedAxis,
        barLayout: 'horizontal',
      });

      expect(result).toHaveLength(5);
      // For horizontal bar, Y axis shows as X-Axis title but uses Y axis ID
      expect(result[0]).toEqual({
        id: SelectAxisContainerId.YAxis,
        title: 'X-Axis',
        items: ['value1', 'value2'],
      });
      // For horizontal bar, X axis shows as Y-Axis title but uses X axis ID
      expect(result[1]).toEqual({
        id: SelectAxisContainerId.XAxis,
        title: 'Y-Axis',
        items: ['column1'],
      });
      expect(result[2]).toEqual({
        id: SelectAxisContainerId.ColorBy,
        title: 'Color By',
        items: [],
      });
      expect(result[3]).toEqual({
        id: SelectAxisContainerId.CategoryAxis,
        title: 'Category',
        items: ['category1'],
      });
      expect(result[4]).toEqual({
        id: SelectAxisContainerId.Tooltip,
        title: 'Tooltip',
        items: [],
      });
    });

    it('should handle horizontal bar chart with empty arrays and populated tooltip', () => {
      const mockSelectedAxis: ChartConfigProps['barAndLineAxis'] = {
        x: [],
        y: [],
        category: [],
        tooltip: ['hover_info', 'extra_data'],
        colorBy: [],
      };

      const result = getChartTypeDropZones({
        chartType: 'bar',
        selectedAxis: mockSelectedAxis,
        barLayout: 'horizontal',
      });

      expect(result).toHaveLength(5);
      // Even with empty arrays, the zones should still be created with swapped titles
      expect(result[0]).toEqual({
        id: SelectAxisContainerId.YAxis,
        title: 'X-Axis', // Y data appears as X-Axis in horizontal mode
        items: [],
      });
      expect(result[1]).toEqual({
        id: SelectAxisContainerId.XAxis,
        title: 'Y-Axis', // X data appears as Y-Axis in horizontal mode
        items: [],
      });
      expect(result[3]).toEqual({
        id: SelectAxisContainerId.CategoryAxis,
        title: 'Category',
        items: [],
      });
      expect(result[4]).toEqual({
        id: SelectAxisContainerId.Tooltip,
        title: 'Tooltip',
        items: ['hover_info', 'extra_data'],
      });
    });
  });

  describe('line chart', () => {
    it('should return correct drop zones for line chart', () => {
      const mockSelectedAxis: ChartConfigProps['barAndLineAxis'] = {
        x: ['date_column'],
        y: ['sales', 'profit'],
        category: [],
        tooltip: ['additional_info'],
        colorBy: [],
      };

      const result = getChartTypeDropZones({
        chartType: 'line',
        selectedAxis: mockSelectedAxis,
        barLayout: 'vertical', // barLayout doesn't affect line charts
      });

      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({
        id: SelectAxisContainerId.XAxis,
        title: 'X-Axis',
        items: ['date_column'],
      });

      expect(result[1]).toEqual({
        id: SelectAxisContainerId.YAxis,
        title: 'Y-Axis',
        items: ['sales', 'profit'],
      });
      expect(result[2]).toEqual({
        id: SelectAxisContainerId.ColorBy,
        title: 'Color By',
        items: [],
      });
      expect(result[3]).toEqual({
        id: SelectAxisContainerId.CategoryAxis,
        title: 'Category',
        items: [],
      });
      expect(result[4]).toEqual({
        id: SelectAxisContainerId.Tooltip,
        title: 'Tooltip',
        items: ['additional_info'],
      });
    });
  });

  describe('scatter chart', () => {
    it('should return correct drop zones for scatter chart including size axis', () => {
      const mockSelectedAxis: ChartConfigProps['scatterAxis'] = {
        x: ['height'],
        y: ['weight'],
        category: ['gender'],
        size: ['age'],
        tooltip: ['name'],
      };

      const result = getChartTypeDropZones({
        chartType: 'scatter',
        selectedAxis: mockSelectedAxis,
        barLayout: 'vertical',
      });

      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({
        id: SelectAxisContainerId.XAxis,
        title: 'X-Axis',
        items: ['height'],
      });
      expect(result[1]).toEqual({
        id: SelectAxisContainerId.YAxis,
        title: 'Y-Axis',
        items: ['weight'],
      });
      expect(result[2]).toEqual({
        id: SelectAxisContainerId.CategoryAxis,
        title: 'Category',
        items: ['gender'],
      });
      expect(result[3]).toEqual({
        id: SelectAxisContainerId.SizeAxis,
        title: 'Size',
        items: ['age'],
      });
      expect(result[4]).toEqual({
        id: SelectAxisContainerId.Tooltip,
        title: 'Tooltip',
        items: ['name'],
      });
    });

    it('should handle empty size array in scatter chart', () => {
      const mockSelectedAxis: ChartConfigProps['scatterAxis'] = {
        x: ['x_value'],
        y: ['y_value'],
        category: [],
        size: [], // Empty size array
        tooltip: null,
      };

      const result = getChartTypeDropZones({
        chartType: 'scatter',
        selectedAxis: mockSelectedAxis,
        barLayout: 'vertical',
      });

      expect(result).toHaveLength(5);
      expect(result[3]).toEqual({
        id: SelectAxisContainerId.SizeAxis,
        title: 'Size',
        items: [],
      });
    });
  });

  describe('pie chart', () => {
    it('should return correct drop zones for pie chart', () => {
      const mockSelectedAxis: ChartConfigProps['pieChartAxis'] = {
        x: ['category'],
        y: ['value'],
        tooltip: ['description'],
      };

      const result = getChartTypeDropZones({
        chartType: 'pie',
        selectedAxis: mockSelectedAxis,
        barLayout: 'vertical',
      });

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        id: SelectAxisContainerId.XAxis,
        title: 'X-Axis',
        items: ['category'],
      });
      expect(result[1]).toEqual({
        id: SelectAxisContainerId.YAxis,
        title: 'Y-Axis',
        items: ['value'],
      });
      expect(result[2]).toEqual({
        id: SelectAxisContainerId.Tooltip,
        title: 'Tooltip',
        items: ['description'],
      });
    });
  });

  describe('combo chart', () => {
    it('should return correct drop zones for combo chart with dual y-axes', () => {
      const mockSelectedAxis: ChartConfigProps['comboChartAxis'] = {
        x: ['month'],
        y: ['revenue'],
        y2: ['customer_count'],
        category: ['region'],
        tooltip: ['details'],
        colorBy: [],
      };

      const result = getChartTypeDropZones({
        chartType: 'combo',
        selectedAxis: mockSelectedAxis,
        barLayout: 'vertical',
      });

      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({
        id: SelectAxisContainerId.XAxis,
        title: 'X-Axis',
        items: ['month'],
      });
      expect(result[1]).toEqual({
        id: SelectAxisContainerId.YAxis,
        title: 'Left Y-Axis', // Special title for combo chart
        items: ['revenue'],
      });
      expect(result[2]).toEqual({
        id: SelectAxisContainerId.Y2Axis,
        title: 'Right Y-Axis',
        items: ['customer_count'],
      });
      expect(result[3]).toEqual({
        id: SelectAxisContainerId.CategoryAxis,
        title: 'Category',
        items: ['region'],
      });
      expect(result[4]).toEqual({
        id: SelectAxisContainerId.Tooltip,
        title: 'Tooltip',
        items: ['details'],
      });
    });
  });

  describe('metric chart (not actually used)', () => {
    it('should return empty drop zones array for metric chart', () => {
      const mockSelectedAxis = {} as any; // Doesn't matter what we pass

      const result = getChartTypeDropZones({
        chartType: 'metric',
        selectedAxis: mockSelectedAxis,
        barLayout: 'vertical',
      });

      expect(result).toEqual([]);
    });
  });

  describe('table chart (not actually used)', () => {
    it('should return empty drop zones array for table chart', () => {
      const mockSelectedAxis = {} as any; // Doesn't matter what we pass

      const result = getChartTypeDropZones({
        chartType: 'table',
        selectedAxis: mockSelectedAxis,
        barLayout: 'vertical',
      });

      expect(result).toEqual([]);
    });
  });
});
