import { type IColumnLabelFormat } from '@/api/asset_interfaces/metric';
import { scatterSeriesBuilder_data, scatterSeriesBuilder_labels } from './scatterSeriesBuilder';
import { createDayjsDate } from '@/lib/date';
import type {
  DatasetOptionsWithTicks,
  DatasetOption
} from '../../../chartHooks/useDatasetOptions/interfaces';
import type { SimplifiedColumnType } from '@/api/asset_interfaces/metric';
import type { SeriesBuilderProps } from './interfaces';
import { ChartType } from '@/api/asset_interfaces/metric/charts/enum';
import type { LabelBuilderProps } from './useSeriesOptions';

describe('scatterSeriesBuilder_data', () => {
  const mockColors = ['#FF0000', '#00FF00'];
  const mockScatterDotSize: [number, number] = [5, 10];
  const mockXAxisKeys = ['timestamp'];

  const baseDatasetOptions: DatasetOptionsWithTicks = {
    datasets: [
      {
        id: '1',
        dataKey: 'metric1',
        data: [10, 20, null, 30],
        ticksForScatter: [
          [1000, 'Jan 1'],
          [2000, 'Jan 2'],
          [3000, 'Jan 3'],
          [4000, 'Jan 4']
        ],
        tooltipData: [],
        label: [{ key: 'metric1', value: 'Metric 1' }],
        axisType: 'y'
      }
    ],
    ticks: [
      [1000, 'Jan 1'],
      [2000, 'Jan 2'],
      [3000, 'Jan 3'],
      [4000, 'Jan 4']
    ],
    ticksKey: [{ key: 'timestamp', value: 'Timestamp' }]
  };

  const baseColumnLabelFormats: Record<string, IColumnLabelFormat> = {
    timestamp: {
      columnType: 'date',
      style: 'date'
    },
    metric1: {
      columnType: 'number',
      style: 'number'
    }
  };

  const baseProps: SeriesBuilderProps = {
    colors: mockColors,
    scatterDotSize: mockScatterDotSize,
    columnLabelFormats: baseColumnLabelFormats,
    xAxisKeys: mockXAxisKeys,
    sizeOptions: null,
    categoryKeys: [],
    datasetOptions: baseDatasetOptions,
    columnSettings: {},
    lineGroupType: null,
    selectedChartType: ChartType.Scatter,
    barShowTotalAtTop: false,
    barGroupType: null,
    yAxisKeys: ['metric1'],
    y2AxisKeys: []
  };

  it('should create basic scatter dataset without size options', () => {
    const result = scatterSeriesBuilder_data(baseProps);

    expect(result).toHaveLength(1);
    expect(result[0].data).toHaveLength(3); // Should exclude null value
    expect(result[0].borderColor).toBe(mockColors[0]);
  });

  it('should handle date x-axis values correctly', () => {
    const timestamp = '2024-01-01T00:00:00Z';
    const dateDataset: DatasetOptionsWithTicks = {
      ...baseDatasetOptions,
      datasets: [
        {
          ...baseDatasetOptions.datasets[0],
          data: [10],
          ticksForScatter: [[timestamp, 'Jan 1']],
          tooltipData: [[]]
        }
      ],
      ticks: [[timestamp, 'Jan 1']]
    };

    const result = scatterSeriesBuilder_data({
      ...baseProps,
      datasetOptions: dateDataset
    });

    expect(result[0].data[0].x).toBe(createDayjsDate(timestamp).valueOf());
  });

  it('should handle size options correctly', () => {
    const sizeOptions = {
      key: 'size',
      minValue: 0,
      maxValue: 100
    };

    const datasetWithSize: DatasetOptionsWithTicks = {
      ...baseDatasetOptions,
      datasets: [
        {
          ...baseDatasetOptions.datasets[0],
          sizeData: [50]
        }
      ]
    };

    const result = scatterSeriesBuilder_data({
      ...baseProps,
      sizeOptions,
      datasetOptions: datasetWithSize
    });

    expect(result[0].data[0].originalR).toBe(50);
  });
});

describe('scatterSeriesBuilder_labels', () => {
  const baseTrendlineSeries = [
    {
      yAxisKey: 'metric1',
      data: [10, 20, 30],
      label: 'Trendline 1',
      tooltipData: [],
      xAxisKeys: ['timestamp'],
      type: 'line' as const,
      borderColor: '#FF0000',
      borderWidth: 2,
      pointRadius: 0
    }
  ];

  const baseProps: LabelBuilderProps = {
    trendlineSeries: baseTrendlineSeries,
    datasetOptions: {
      datasets: [
        {
          id: '1',
          dataKey: 'metric1',
          data: [10, 20, 30],
          ticksForScatter: [
            [1000, 'Jan 1'],
            [2000, 'Jan 2'],
            [3000, 'Jan 3']
          ],
          label: [{ key: 'metric1', value: 'Dataset 1' }],
          axisType: 'y',
          tooltipData: []
        }
      ],
      ticks: [
        [1000, 'Jan 1'],
        [2000, 'Jan 2'],
        [3000, 'Jan 3']
      ],
      ticksKey: [{ key: 'timestamp', value: 'Timestamp' }]
    },
    columnLabelFormats: {
      timestamp: {
        columnType: 'timestamp' as SimplifiedColumnType,
        style: 'date'
      }
    },
    xAxisKeys: ['timestamp'],
    sizeKey: [],
    columnSettings: {}
  };

  it('should return undefined when no trendlines exist', () => {
    const result = scatterSeriesBuilder_labels({
      ...baseProps,
      trendlineSeries: []
    });

    expect(result).toBeUndefined();
  });

  it('should process trendline series correctly', () => {
    const result = scatterSeriesBuilder_labels(baseProps);
    expect(result).toBeDefined();
  });
});
