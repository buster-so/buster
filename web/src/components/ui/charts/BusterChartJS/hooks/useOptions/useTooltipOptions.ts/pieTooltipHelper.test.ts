import type { IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts/columnLabelInterfaces';
import type { Chart, TooltipItem } from 'chart.js';
import { describe, expect, it } from 'vitest';
import { pieTooltipHelper } from './pieTooltipHelper';

describe('pieTooltipHelper', () => {
  // Mock data setup
  const mockDataset = {
    type: 'pie',
    label: 'Test Dataset',
    backgroundColor: ['#FF0000', '#00FF00'],
    data: [250, 750],
    tooltipData: [
      [
        { key: 'value', value: 250 },
        { key: 'percentage', value: 25 }
      ],
      [
        { key: 'value', value: 750 },
        { key: 'percentage', value: 75 }
      ]
    ]
  };

  const mockChart = {
    data: {
      datasets: [mockDataset]
    },
    $totalizer: {
      seriesTotals: [1000] // Total for the first dataset
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

  const mockDataPoints = [
    {
      datasetIndex: 0,
      dataIndex: 0,
      dataset: mockDataset,
      parsed: 250,
      raw: 250,
      formattedValue: '250',
      label: 'Test Dataset',
      chart: mockChart
    } as TooltipItem<any>
  ];

  it('should correctly format tooltip items', () => {
    const keyToUsePercentage = ['percentage'];

    const result = pieTooltipHelper(
      mockDataPoints,
      mockChart,
      mockColumnLabelFormats,
      keyToUsePercentage
    );

    expect(result).toHaveLength(2);

    // Check the value item
    expect(result[0]).toEqual({
      seriesType: 'pie',
      color: '#FF0000',
      usePercentage: false,
      formattedLabel: 'Value',
      values: [
        {
          formattedValue: '250',
          formattedLabel: 'Value',
          formattedPercentage: undefined
        }
      ]
    });

    // Check the percentage item
    expect(result[1]).toEqual({
      seriesType: 'pie',
      color: '#FF0000',
      usePercentage: true,
      formattedLabel: 'Percentage',
      values: [
        {
          formattedValue: '25%',
          formattedLabel: 'Percentage',
          formattedPercentage: '25%'
        }
      ]
    });
  });

  it('should handle empty tooltip data', () => {
    const emptyDataPoints = [
      {
        datasetIndex: 0,
        dataIndex: 0,
        dataset: {
          ...mockDataset,
          tooltipData: [[]]
        },
        parsed: 100,
        raw: 100,
        formattedValue: '100',
        label: 'Test Dataset',
        chart: mockChart
      } as TooltipItem<any>
    ];

    const result = pieTooltipHelper(emptyDataPoints, mockChart, mockColumnLabelFormats, []);

    expect(result).toHaveLength(0);
  });

  it('should handle multiple data points', () => {
    const multipleDataPoints = [
      {
        datasetIndex: 0,
        dataIndex: 0,
        dataset: mockDataset,
        parsed: 300,
        raw: 300,
        formattedValue: '300',
        label: 'Test Dataset',
        chart: mockChart
      } as TooltipItem<any>,
      {
        datasetIndex: 0,
        dataIndex: 1,
        dataset: mockDataset,
        parsed: 700,
        raw: 700,
        formattedValue: '700',
        label: 'Test Dataset',
        chart: mockChart
      } as TooltipItem<any>
    ];

    const keyToUsePercentage = ['percentage'];

    const result = pieTooltipHelper(
      multipleDataPoints,
      mockChart,
      mockColumnLabelFormats,
      keyToUsePercentage
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.seriesType === 'pie')).toBe(true);
  });

  it('should format percentages correctly', () => {
    const keyToUsePercentage = ['value', 'percentage'];

    const result = pieTooltipHelper(
      mockDataPoints,
      mockChart,
      mockColumnLabelFormats,
      keyToUsePercentage
    );

    // Both items should have formatted percentages since both keys are in keyToUsePercentage
    expect(result.every((item) => item.usePercentage)).toBe(true);
    expect(result.every((item) => item.values[0].formattedPercentage?.includes('%'))).toBe(true);
  });
});
