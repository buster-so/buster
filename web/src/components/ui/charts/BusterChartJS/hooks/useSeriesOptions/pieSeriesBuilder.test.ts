import { formatLabel } from '@/lib';
import { describe, expect, it, vi } from 'vitest';
import { JOIN_CHARACTER, formatLabelForDataset } from '../../../commonHelpers';
import { pieSeriesBuilder_data, pieSeriesBuilder_labels } from './pieSeriesBuilder';

// Mock dependencies
vi.mock('../../../commonHelpers', () => ({
  formatLabelForDataset: vi.fn((dataset) => `Formatted ${dataset.name}`),
  JOIN_CHARACTER: '|'
}));

vi.mock('@/lib', () => ({
  formatLabel: vi.fn((item, format) => (format ? `Formatted ${item}` : String(item)))
}));

// Mock the implementation of the functions to avoid TypeScript errors
// This allows us to test the functions without having to match the exact complex types
vi.mock('./pieSeriesBuilder', async () => {
  const originalModule = (await vi.importActual('./pieSeriesBuilder')) as any;
  return {
    ...originalModule,
    pieSeriesBuilder_data: vi.fn(originalModule.pieSeriesBuilder_data),
    pieSeriesBuilder_labels: vi.fn(originalModule.pieSeriesBuilder_labels)
  };
});

describe('pieSeriesBuilder_data', () => {
  it('should transform dataset options into pie chart series', () => {
    // Mock input data
    const props = {
      datasetOptions: {
        datasets: [
          {
            name: 'Dataset 1',
            dataKey: 'value1',
            data: [10, 20, 30],
            tooltipData: { someInfo: 'test' }
          },
          {
            name: 'Dataset 2',
            dataKey: 'value2',
            data: [15, 25, 35],
            tooltipData: { someInfo: 'test2' }
          }
        ],
        // Adding missing required properties
        ticks: [['Item 1', 'Item 2']],
        ticksKey: [
          { key: 'key1', value: 'value1' },
          { key: 'key2', value: 'value2' }
        ]
      },
      colors: ['#ff0000', '#00ff00', '#0000ff'],
      xAxisKeys: ['key1', 'key2'],
      columnLabelFormats: { key1: 'format1' },
      // Adding required properties
      columnSettings: {},
      sizeOptions: null,
      scatterDotSize: [5, 20], // Fixed to be a tuple of numbers
      lineGroupType: 'normal',
      barShowTotalAtTop: false,
      barGroupType: 'grouped',
      yAxisKeys: ['value1', 'value2'],
      y2AxisKeys: []
    };

    // Expected output
    const expected = [
      {
        label: 'Formatted Dataset 1',
        backgroundColor: ['#ff0000', '#00ff00', '#0000ff'],
        xAxisKeys: ['key1', 'key2'],
        yAxisKey: 'value1',
        data: [10, 20, 30],
        borderColor: 'white',
        tooltipData: { someInfo: 'test' }
      },
      {
        label: 'Formatted Dataset 2',
        backgroundColor: ['#ff0000', '#00ff00', '#0000ff'],
        xAxisKeys: ['key1', 'key2'],
        yAxisKey: 'value2',
        data: [15, 25, 35],
        borderColor: 'white',
        tooltipData: { someInfo: 'test2' }
      }
    ];

    const result = pieSeriesBuilder_data(props as any);
    expect(result).toEqual(expected);
    expect(formatLabelForDataset).toHaveBeenCalledTimes(2);
    expect(formatLabelForDataset).toHaveBeenCalledWith(
      props.datasetOptions.datasets[0],
      props.columnLabelFormats
    );
    expect(formatLabelForDataset).toHaveBeenCalledWith(
      props.datasetOptions.datasets[1],
      props.columnLabelFormats
    );
  });

  it('should handle empty datasets', () => {
    const props = {
      datasetOptions: {
        datasets: [],
        // Adding missing required properties
        ticks: [],
        ticksKey: []
      },
      colors: ['#ff0000'],
      xAxisKeys: ['key1'],
      columnLabelFormats: {},
      // Adding required properties
      columnSettings: {},
      sizeOptions: null,
      scatterDotSize: [5, 20], // Fixed to be a tuple of numbers
      lineGroupType: 'normal',
      barShowTotalAtTop: false,
      barGroupType: 'grouped',
      yAxisKeys: [],
      y2AxisKeys: []
    };

    const result = pieSeriesBuilder_data(props as any);
    expect(result).toEqual([]);
  });
});

describe('pieSeriesBuilder_labels', () => {
  it('should generate labels from ticks data', () => {
    // Mock input data with all required properties
    const props = {
      datasetOptions: {
        ticks: [['Item 1', 'Item 2']],
        ticksKey: [
          { key: 'key1', value: 'value1' },
          { key: 'key2', value: 'value2' }
        ],
        // Adding missing required property
        datasets: []
      },
      columnLabelFormats: {
        key1: 'format1',
        key2: null
      },
      // Adding required properties
      xAxisKeys: ['key1', 'key2'],
      sizeKey: [], // Fixed to be an empty array instead of null
      columnSettings: {},
      trendlineSeries: []
    };

    // Reset mocks
    (formatLabel as any).mockImplementation((item: any, format: any) =>
      format ? `Formatted ${item}` : String(item)
    );

    const result = pieSeriesBuilder_labels(props as any);

    // We expect each item to be processed through formatLabel and joined
    expect(result).toEqual(['Formatted Item 1|Item 2']);
    expect(formatLabel).toHaveBeenCalledWith('Item 1', 'format1');
    expect(formatLabel).toHaveBeenCalledWith('Item 2', null);
  });

  it('should handle multiple tick sets', () => {
    const props = {
      datasetOptions: {
        ticks: [
          ['Item 1', 'Item 2'],
          ['Item 3', 'Item 4']
        ],
        ticksKey: [
          { key: 'key1', value: 'value1' },
          { key: 'key2', value: 'value2' }
        ],
        // Adding missing required property
        datasets: []
      },
      columnLabelFormats: {
        key1: 'format1',
        key2: 'format2'
      },
      // Adding required properties
      xAxisKeys: ['key1', 'key2'],
      sizeKey: [], // Fixed to be an empty array instead of null
      columnSettings: {},
      trendlineSeries: []
    };

    const result = pieSeriesBuilder_labels(props as any);
    expect(result).toEqual([
      'Formatted Item 1|Formatted Item 2',
      'Formatted Item 3|Formatted Item 4'
    ]);
  });

  it('should handle empty ticks', () => {
    const props = {
      datasetOptions: {
        ticks: [],
        ticksKey: [],
        // Adding missing required property
        datasets: []
      },
      columnLabelFormats: {},
      // Adding required properties
      xAxisKeys: [],
      sizeKey: [], // Fixed to be an empty array instead of null
      columnSettings: {},
      trendlineSeries: []
    };

    const result = pieSeriesBuilder_labels(props as any);
    expect(result).toEqual([]);
  });
});
