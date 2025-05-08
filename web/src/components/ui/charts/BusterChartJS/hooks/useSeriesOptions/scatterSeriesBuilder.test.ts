import { type IColumnLabelFormat } from '@/api/asset_interfaces/metric';
import { scatterSeriesBuilder_data, scatterSeriesBuilder_labels } from './scatterSeriesBuilder';
import { createDayjsDate } from '@/lib/date';
import type { DatasetOptionsWithTicks } from '../../../chartHooks/useDatasetOptions/interfaces';
import type { SimplifiedColumnType } from '@/api/asset_interfaces/metric';
import type { SeriesBuilderProps } from './interfaces';
import type { LabelBuilderProps } from './useSeriesOptions';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';

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
    datasetOptions: baseDatasetOptions,
    columnSettings: {},
    lineGroupType: null,
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
  test('should return undefined when trendlineSeries is empty', () => {
    const props: LabelBuilderProps = {
      trendlineSeries: [],
      datasetOptions: {
        ticks: [],
        datasets: [],
        ticksKey: []
      },
      columnLabelFormats: {},
      xAxisKeys: ['x'],
      sizeKey: [],
      columnSettings: {}
    };

    const result = scatterSeriesBuilder_labels(props);
    expect(result).toBeUndefined();
  });

  test('should process date labels directly when x-axis is date type', () => {
    const dateString1 = '2023-01-01';
    const dateString2 = '2023-01-02';

    const props: LabelBuilderProps = {
      trendlineSeries: [{ yAxisKey: 'y1' } as any],
      datasetOptions: {
        ticks: [[dateString1], [dateString2]],
        datasets: [{ dataKey: 'y1', data: [10, 20] } as any],
        ticksKey: [{ key: 'x', value: 'X Axis' }]
      } as any,
      columnLabelFormats: {
        x: {
          columnType: 'date',
          style: 'date'
        }
      },
      xAxisKeys: ['x'],
      sizeKey: [],
      columnSettings: {}
    };

    const result = scatterSeriesBuilder_labels(props);
    expect(result).toEqual([
      createDayjsDate(dateString1).toDate(),
      createDayjsDate(dateString2).toDate()
    ]);
  });

  test('should collect all ticks without deduplication', () => {
    const props: LabelBuilderProps = {
      trendlineSeries: [{ yAxisKey: 'y1' } as any, { yAxisKey: 'y2' } as any],
      datasetOptions: {
        ticks: [],
        datasets: [
          {
            dataKey: 'y1',
            data: [10, 20],
            ticksForScatter: [
              [1, 'A'],
              [2, 'B']
            ]
          } as any,
          {
            dataKey: 'y2',
            data: [30, 40, 50],
            ticksForScatter: [
              [1, 'A'],
              [3, 'C'],
              [5, 'D']
            ]
          } as any
        ],
        ticksKey: [{ key: 'x', value: 'X Axis' }]
      } as any,
      columnLabelFormats: {
        x: DEFAULT_COLUMN_LABEL_FORMAT
      },
      xAxisKeys: ['x'],
      sizeKey: [],
      columnSettings: {}
    };

    const result = scatterSeriesBuilder_labels(props);
    // Should include duplicate [1, 'A'] from both datasets
    expect(result).toEqual([1, 'A', 1, 'A', 2, 'B', 3, 'C', 5, 'D']);
  });

  test('should return undefined when no relevant datasets are found', () => {
    const props: LabelBuilderProps = {
      trendlineSeries: [{ yAxisKey: 'y1' } as any],
      datasetOptions: {
        ticks: [],
        datasets: [
          {
            dataKey: 'y2', // Not matching with trendlineSeries
            data: [10, 20],
            ticksForScatter: [
              [1, 'A'],
              [2, 'B']
            ]
          } as any
        ],
        ticksKey: [{ key: 'x', value: 'X Axis' }]
      } as any,
      columnLabelFormats: {
        x: DEFAULT_COLUMN_LABEL_FORMAT
      },
      xAxisKeys: ['x'],
      sizeKey: [],
      columnSettings: {}
    };

    const result = scatterSeriesBuilder_labels(props);
    expect(result).toBeUndefined();
  });
});
