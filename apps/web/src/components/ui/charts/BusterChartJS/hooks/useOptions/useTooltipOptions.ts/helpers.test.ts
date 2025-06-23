import type { Chart } from 'chart.js';
import { describe, expect, it } from 'vitest';
import type { BusterChartProps } from '@/api/asset_interfaces/metric/charts';
import { getPercentage, percentageFormatter } from './helpers';

describe('getPercentage', () => {
  const mockChart = {
    data: {
      datasets: [
        {
          data: [200, 300],
          hidden: false,
          isTrendline: false
        }
      ]
    },
    $totalizer: {
      seriesTotals: [1000, 2000],
      stackTotals: [500]
    }
  } as unknown as Chart;

  const mockColumnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']> = {
    'test.field': {
      style: 'percent',
      columnType: 'number'
    }
  };

  it('should calculate series percentage when hasMultipleShownDatasets is false', () => {
    const result = getPercentage(
      200, // rawValue
      0, // dataIndex
      0, // datasetIndex
      mockColumnLabelFormats,
      mockChart,
      false, // hasMultipleShownDatasets
      undefined // percentageMode
    );

    // 200/1000 = 20%
    expect(result).toBe('20%');
  });

  it('should calculate stacked percentage when percentageMode is stacked', () => {
    const result = getPercentage(
      100, // rawValue
      0, // dataIndex
      0, // datasetIndex
      mockColumnLabelFormats,
      mockChart,
      false, // hasMultipleShownDatasets
      'stacked' // percentageMode
    );

    // 100/500 = 20%
    expect(result).toBe('20%');
  });

  it('should calculate stacked percentage when hasMultipleShownDatasets is true', () => {
    const result = getPercentage(
      100, // rawValue
      0, // dataIndex
      0, // datasetIndex
      mockColumnLabelFormats,
      mockChart,
      true, // hasMultipleShownDatasets
      undefined // percentageMode
    );

    // 100/500 = 20%
    expect(result).toBe('20%');
  });
});

describe('percentageFormatter', () => {
  it('should format percentage when column format is already percentage style', () => {
    const columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']> = {
      'test.field': {
        style: 'percent',
        columnType: 'number'
      }
    };

    const result = percentageFormatter(
      25.5, // percentage value
      'test.field',
      columnLabelFormats
    );

    expect(result).toBe('25.5%');
  });

  it('should format percentage when column format is not percentage style', () => {
    const columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']> = {
      'test.field': {
        style: 'number',
        columnType: 'number'
      }
    };

    const result = percentageFormatter(33.333, 'test.field', columnLabelFormats);

    expect(result).toBe('33.33%');
  });

  it('should handle nested field paths correctly', () => {
    const columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']> = {
      field: {
        style: 'percent',
        columnType: 'number'
      }
    };

    const result = percentageFormatter(50, 'nested.field', columnLabelFormats);

    expect(result).toBe('50%');
  });
});
