import { barAndLineTooltipHelper } from './barAndLineTooltipHelper';
import type {
  Chart,
  TooltipItem,
  ChartTypeRegistry,
  BarControllerDatasetOptions,
  ChartDatasetProperties
} from 'chart.js';
import type { BusterChartConfigProps } from '@/api/asset_interfaces/metric/charts';
import type { IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts/columnLabelInterfaces';

type MockDataset = Partial<
  ChartDatasetProperties<'bar', number[]> & BarControllerDatasetOptions
> & {
  type: 'bar';
  label: string;
  data: number[];
  tooltipData: { key: string; value: number }[][];
  yAxisKey: string;
  xAxisKeys: string[];
};

describe('barAndLineTooltipHelper', () => {
  // Mock data setup
  const mockChart = {
    data: {
      datasets: [
        {
          data: [100, 200, 300],
          label: 'Dataset 1',
          type: 'bar' as const,
          hidden: false,
          isTrendline: false
        },
        {
          data: [150, 250, 350],
          label: 'Dataset 2',
          type: 'bar' as const,
          hidden: false,
          isTrendline: false
        }
      ]
    },
    $totalizer: {
      stackTotals: [250, 450, 650],
      seriesTotals: [600, 750]
    },
    scales: {
      x: {
        getPixelForValue: () => 0
      },
      y: {
        getPixelForValue: () => 0
      }
    }
  } as unknown as Chart;

  const mockColumnLabelFormats: Record<string, IColumnLabelFormat> = {
    value: {
      columnType: 'number',
      style: 'number'
    },
    percentage: {
      columnType: 'number',
      style: 'percent'
    },
    label: {
      columnType: 'text',
      style: 'string'
    }
  };

  const createMockDataset = (overrides = {}): MockDataset => ({
    type: 'bar',
    label: 'Test Dataset',
    backgroundColor: '#FF0000',
    borderColor: '#FF0000',
    yAxisKey: 'value',
    data: [250, 300, 350],
    xAxisKeys: ['x'],
    barPercentage: 0.9,
    categoryPercentage: 0.8,
    tooltipData: [
      [
        { key: 'value', value: 250 },
        { key: 'percentage', value: 25 }
      ]
    ],
    hidden: false,
    isTrendline: false,
    ...overrides
  });

  const createMockDataPoint = (overrides = {}): TooltipItem<'bar'> => ({
    datasetIndex: 0,
    dataIndex: 0,
    dataset: createMockDataset(),
    parsed: { x: 0, y: 250 },
    raw: 250,
    formattedValue: '250',
    label: 'Test Dataset',
    chart: mockChart,
    element: {} as any,
    ...overrides
  });

  it('should correctly format tooltip items', () => {
    const keyToUsePercentage = ['percentage'];
    const hasMultipleShownDatasets = true;
    const mockDataPoint = createMockDataPoint();

    const result = barAndLineTooltipHelper(
      [mockDataPoint],
      mockChart,
      mockColumnLabelFormats,
      keyToUsePercentage,
      hasMultipleShownDatasets,
      undefined
    );

    expect(result).toHaveLength(2);

    // Check the value item
    expect(result[0]).toEqual({
      seriesType: 'bar',
      color: '#FF0000',
      usePercentage: false,
      formattedLabel: 'Test Dataset',
      values: [
        {
          formattedValue: '250',
          formattedLabel: 'Test Dataset',
          formattedPercentage: '100%'
        }
      ]
    });
  });

  it('should handle stacked percentage mode', () => {
    const result = barAndLineTooltipHelper(
      [createMockDataPoint()],
      mockChart,
      mockColumnLabelFormats,
      [],
      true,
      'stacked'
    );

    expect(result.every((item) => item.usePercentage)).toBe(true);
    result.forEach((item) => {
      expect(item.values[0].formattedPercentage).toBeDefined();
    });
  });

  it('should handle empty tooltip data', () => {
    const emptyDataset = createMockDataset({ tooltipData: [[]] });
    const emptyDataPoint = createMockDataPoint({ dataset: emptyDataset });

    const result = barAndLineTooltipHelper(
      [emptyDataPoint],
      mockChart,
      mockColumnLabelFormats,
      [],
      false,
      undefined
    );

    expect(result).toHaveLength(0);
  });

  it('should use default color when yAxisKey does not match item key', () => {
    const modifiedDataset = createMockDataset({ yAxisKey: 'different_key' });
    const modifiedDataPoint = createMockDataPoint({ dataset: modifiedDataset });

    const result = barAndLineTooltipHelper(
      [modifiedDataPoint],
      mockChart,
      mockColumnLabelFormats,
      [],
      false,
      undefined
    );

    expect(result.every((item) => item.color === undefined)).toBe(true);
  });
});
