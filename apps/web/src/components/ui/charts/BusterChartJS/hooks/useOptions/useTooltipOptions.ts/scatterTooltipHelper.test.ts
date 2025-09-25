import { type ColumnLabelFormat, DEFAULT_COLUMN_LABEL_FORMAT } from '@buster/server-shared/metrics';
import type { TooltipItem } from 'chart.js';
import { describe, expect, it } from 'vitest';
import { scatterTooltipHelper } from './scatterTooltipHelper';

describe('scatterTooltipHelper', () => {
  // Mock data setup
  const mockColumnLabelFormats: Record<string, ColumnLabelFormat> = {
    revenue: {
      ...DEFAULT_COLUMN_LABEL_FORMAT,
      columnType: 'number',
      style: 'currency',
    },
    count: {
      ...DEFAULT_COLUMN_LABEL_FORMAT,
      columnType: 'number',
      style: 'number',
    },
    percentage: {
      ...DEFAULT_COLUMN_LABEL_FORMAT,
      columnType: 'number',
      style: 'percent',
    },
    category: {
      ...DEFAULT_COLUMN_LABEL_FORMAT,
      columnType: 'text',
      style: 'string',
    },
  };

  const mockDataset = {
    label: 'Sales Data',
    backgroundColor: '#FF6B6B',
    tooltipData: [
      [
        { key: 'revenue', value: 25000 },
        { key: 'count', value: 150 },
        { key: 'category', value: 'Electronics' },
      ],
      [
        { key: 'revenue', value: 18000 },
        { key: 'count', value: 92 },
        { key: 'category', value: 'Clothing' },
      ],
    ],
  };

  const mockDataPoints = [
    {
      datasetIndex: 0,
      dataIndex: 0,
      dataset: mockDataset,
      parsed: { x: 25000, y: 150 },
      raw: { x: 25000, y: 150 },
      formattedValue: '(25000, 150)',
      label: 'Sales Data',
    } as TooltipItem<any>,
  ];

  it('should correctly format tooltip items for scatter chart', () => {
    const result = scatterTooltipHelper(mockDataPoints, mockColumnLabelFormats);

    expect(result).toHaveLength(3);

    // Check revenue item
    expect(result[0]).toEqual({
      color: '#FF6B6B',
      seriesType: 'scatter',
      usePercentage: false,
      formattedLabel: 'Sales Data',
      values: [
        {
          formattedValue: '$25,000.00',
          formattedPercentage: undefined,
          formattedLabel: 'Revenue',
        },
      ],
    });

    // Check count item
    expect(result[1]).toEqual({
      color: '#FF6B6B',
      seriesType: 'scatter',
      usePercentage: false,
      formattedLabel: 'Sales Data',
      values: [
        {
          formattedValue: '150',
          formattedPercentage: undefined,
          formattedLabel: 'Count',
        },
      ],
    });

    // Check category item
    expect(result[2]).toEqual({
      color: '#FF6B6B',
      seriesType: 'scatter',
      usePercentage: false,
      formattedLabel: 'Sales Data',
      values: [
        {
          formattedValue: 'Electronics',
          formattedPercentage: undefined,
          formattedLabel: 'Category',
        },
      ],
    });
  });

  it('should handle empty tooltip data', () => {
    const emptyDataPoints = [
      {
        datasetIndex: 0,
        dataIndex: 0,
        dataset: {
          label: 'Empty Dataset',
          backgroundColor: '#333333',
          tooltipData: [],
        },
        parsed: { x: 100, y: 200 },
        raw: { x: 100, y: 200 },
        formattedValue: '(100, 200)',
        label: 'Empty Dataset',
      } as TooltipItem<any>,
    ];

    const result = scatterTooltipHelper(emptyDataPoints, mockColumnLabelFormats);

    expect(result).toHaveLength(0);
  });

  it('should handle undefined tooltip data at specific index', () => {
    const dataPointsWithUndefinedTooltipData = [
      {
        datasetIndex: 0,
        dataIndex: 5, // Index that doesn't exist in tooltipData
        dataset: {
          label: 'Test Dataset',
          backgroundColor: '#00FF00',
          tooltipData: [[{ key: 'value', value: 100 }], [{ key: 'value', value: 200 }]], // Only has indices 0 and 1
        },
        parsed: { x: 300, y: 400 },
        raw: { x: 300, y: 400 },
        formattedValue: '(300, 400)',
        label: 'Test Dataset',
      } as TooltipItem<any>,
    ];

    const result = scatterTooltipHelper(dataPointsWithUndefinedTooltipData, mockColumnLabelFormats);

    expect(result).toHaveLength(0);
  });

  it('should only process the first data point when multiple are provided', () => {
    const multipleDataPoints = [
      {
        datasetIndex: 0,
        dataIndex: 0,
        dataset: mockDataset,
        parsed: { x: 25000, y: 150 },
        raw: { x: 25000, y: 150 },
        formattedValue: '(25000, 150)',
        label: 'Sales Data',
      } as TooltipItem<any>,
      {
        datasetIndex: 0,
        dataIndex: 1,
        dataset: mockDataset,
        parsed: { x: 18000, y: 92 },
        raw: { x: 18000, y: 92 },
        formattedValue: '(18000, 92)',
        label: 'Sales Data',
      } as TooltipItem<any>,
    ];

    const result = scatterTooltipHelper(multipleDataPoints, mockColumnLabelFormats);

    // Should only process first data point (index 0)
    expect(result).toHaveLength(3);
    expect(result[0].values[0].formattedValue).toBe('$25,000.00'); // Revenue from first data point
    expect(result[1].values[0].formattedValue).toBe('150'); // Count from first data point
  });

  it('should handle different data types and formatting', () => {
    const mixedDataDataset = {
      label: 'Mixed Data',
      backgroundColor: '#9B59B6',
      tooltipData: [
        [
          { key: 'percentage', value: 0.85 },
          { key: 'count', value: 1500 },
          { key: 'category', value: 'Premium' },
        ],
      ],
    };

    const mixedDataPoints = [
      {
        datasetIndex: 0,
        dataIndex: 0,
        dataset: mixedDataDataset,
        parsed: { x: 0.85, y: 1500 },
        raw: { x: 0.85, y: 1500 },
        formattedValue: '(0.85, 1500)',
        label: 'Mixed Data',
      } as TooltipItem<any>,
    ];

    const result = scatterTooltipHelper(mixedDataPoints, mockColumnLabelFormats);

    expect(result).toHaveLength(3);

    // Check percentage formatting
    expect(result[0]).toEqual({
      color: '#9B59B6',
      seriesType: 'scatter',
      usePercentage: false,
      formattedLabel: 'Mixed Data',
      values: [
        {
          formattedValue: '0.85%',
          formattedPercentage: undefined,
          formattedLabel: 'Percentage',
        },
      ],
    });

    // Check number formatting
    expect(result[1].values[0].formattedValue).toBe('1,500');

    // Check string formatting
    expect(result[2].values[0].formattedValue).toBe('Premium');
  });

  it('should handle missing column label formats gracefully', () => {
    const datasetWithUnknownKeys = {
      label: 'Unknown Keys',
      backgroundColor: '#E74C3C',
      tooltipData: [
        [
          { key: 'unknownKey', value: 42 },
          { key: 'anotherUnknownKey', value: 'test' },
        ],
      ],
    };

    const dataPoints = [
      {
        datasetIndex: 0,
        dataIndex: 0,
        dataset: datasetWithUnknownKeys,
        parsed: { x: 42, y: 100 },
        raw: { x: 42, y: 100 },
        formattedValue: '(42, 100)',
        label: 'Unknown Keys',
      } as TooltipItem<any>,
    ];

    const result = scatterTooltipHelper(dataPoints, mockColumnLabelFormats);

    expect(result).toHaveLength(2);
    // Should still format the values even with unknown keys
    expect(result[0].values[0].formattedValue).toBe('42');
    expect(result[1].values[0].formattedValue).toBe('test');
  });

  it('should preserve series type as scatter', () => {
    const result = scatterTooltipHelper(mockDataPoints, mockColumnLabelFormats);

    expect(result.every((item) => item.seriesType === 'scatter')).toBe(true);
  });

  it('should set usePercentage to false for all items', () => {
    const result = scatterTooltipHelper(mockDataPoints, mockColumnLabelFormats);

    expect(result.every((item) => item.usePercentage === false)).toBe(true);
  });

  it('should set formattedPercentage to undefined for all items', () => {
    const result = scatterTooltipHelper(mockDataPoints, mockColumnLabelFormats);

    expect(
      result.every((item) => item.values.every((value) => value.formattedPercentage === undefined))
    ).toBe(true);
  });

  it('should handle mixed null and valid values in tooltip data', () => {
    const mixedDataDataset = {
      label: 'Mixed Values',
      backgroundColor: '#3498DB',
      tooltipData: [
        [
          { key: 'revenue', value: null },
          { key: 'count', value: 100 },
          { key: 'category', value: undefined },
          { key: 'percentage', value: 0.5 },
        ],
      ],
    };

    const mixedDataPoints = [
      {
        datasetIndex: 0,
        dataIndex: 0,
        dataset: mixedDataDataset,
        parsed: { x: null, y: 100 },
        raw: { x: null, y: 100 },
        formattedValue: '(null, 100)',
        label: 'Mixed Values',
      } as TooltipItem<any>,
    ];

    const result = scatterTooltipHelper(mixedDataPoints, mockColumnLabelFormats);

    expect(result).toHaveLength(4);

    // Check null revenue value (currency format with null defaults to $0.00)
    expect(result[0]).toEqual({
      color: '#3498DB',
      seriesType: 'scatter',
      usePercentage: false,
      formattedLabel: 'Mixed Values',
      values: [
        {
          formattedValue: '0',
          formattedPercentage: undefined,
          formattedLabel: 'Revenue',
        },
      ],
    });

    // Check valid count value
    expect(result[1].values[0].formattedValue).toBe('100');

    // Check undefined category value (text format with undefined defaults to 'undefined')
    expect(result[2].values[0].formattedValue).toBe('undefined');

    // Check valid percentage value
    expect(result[3].values[0].formattedValue).toBe('0.5%');
  });
});
