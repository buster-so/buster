import type { ChartConfigProps } from '@buster/server-shared/metrics';
import type { Chart, ChartTypeRegistry, TooltipItem } from 'chart.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatLabel } from '@/lib/columnFormatter';
import { barAndLineTooltipHelper } from './barAndLineTooltipHelper';
import { getPercentage } from './helpers';

// Mock dependencies
vi.mock('@/lib/columnFormatter', () => ({
  formatLabel: vi.fn(),
}));

vi.mock('./helpers', () => ({
  getPercentage: vi.fn(),
}));

const mockFormatLabel = vi.mocked(formatLabel);
const mockGetPercentage = vi.mocked(getPercentage);

describe('barAndLineTooltipHelper', () => {
  const mockChart = {} as Chart;
  const mockColumnLabelFormats = {} as NonNullable<ChartConfigProps['columnLabelFormats']>;
  const mockKeyToUsePercentage = ['percentage_metric'];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFormatLabel.mockReturnValue('formatted_value');
    mockGetPercentage.mockReturnValue('25%');
  });

  it('should format single dataset tooltip correctly when hasMultipleShownDatasets is false', () => {
    // Arrange
    const mockDataPoints: TooltipItem<keyof ChartTypeRegistry>[] = [
      {
        dataset: {
          label: 'Revenue Dataset',
          backgroundColor: '#ff0000',
          tooltipData: [[{ key: 'revenue', value: 1000 }]],
          yAxisKey: 'revenue',
        },
        dataIndex: 0,
        datasetIndex: 0,
      } as unknown as TooltipItem<keyof ChartTypeRegistry>,
    ];

    mockFormatLabel
      .mockReturnValueOnce('Revenue') // for formattedLabel
      .mockReturnValueOnce('$1,000'); // for formattedValue
    mockGetPercentage.mockReturnValue('50%');

    // Act
    const result = barAndLineTooltipHelper(
      mockDataPoints,
      mockChart,
      mockColumnLabelFormats,
      [],
      false, // hasMultipleShownDatasets = false
      undefined
    );

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      seriesType: 'bar',
      color: '#ff0000',
      usePercentage: false,
      formattedLabel: 'Revenue',
      values: [
        {
          formattedValue: '$1,000',
          formattedLabel: 'Revenue',
          formattedPercentage: '50%',
        },
      ],
    });
  });

  it('should use dataset label when hasMultipleShownDatasets is true', () => {
    // Arrange
    const mockDataPoints: TooltipItem<keyof ChartTypeRegistry>[] = [
      {
        dataset: {
          label: 'Revenue Dataset',
          backgroundColor: '#ff0000',
          tooltipData: [[{ key: 'revenue', value: 1000 }]],
          yAxisKey: 'revenue',
        },
        dataIndex: 0,
        datasetIndex: 0,
      } as unknown as TooltipItem<keyof ChartTypeRegistry>,
    ];

    mockFormatLabel.mockReturnValue('$1,000');
    mockGetPercentage.mockReturnValue('25%');

    // Act
    const result = barAndLineTooltipHelper(
      mockDataPoints,
      mockChart,
      mockColumnLabelFormats,
      [],
      true, // hasMultipleShownDatasets = true
      undefined
    );

    // Assert
    expect(mockFormatLabel).toHaveBeenCalledTimes(1); // Only for formattedValue
    expect(result).toHaveLength(1);
    expect(result[0].formattedLabel).toBe('Revenue Dataset'); // Uses dataset.label
    expect(result[0].values[0].formattedLabel).toBe('Revenue Dataset');
  });

  it('should return empty array when tooltipData is missing', () => {
    // Arrange
    const mockDataPoints: TooltipItem<keyof ChartTypeRegistry>[] = [
      {
        dataset: {
          label: 'Revenue Dataset',
          backgroundColor: '#ff0000',
          tooltipData: [null], // No data at this index
          yAxisKey: 'revenue',
        },
        dataIndex: 0,
        datasetIndex: 0,
      } as unknown as TooltipItem<keyof ChartTypeRegistry>,
    ];

    // Act
    const result = barAndLineTooltipHelper(
      mockDataPoints,
      mockChart,
      mockColumnLabelFormats,
      [],
      false,
      undefined
    );

    // Assert
    expect(result).toHaveLength(0);
    expect(mockFormatLabel).not.toHaveBeenCalled();
  });

  it('should use backgroundColor when yAxisKey matches item key', () => {
    // Arrange
    const mockDataPoints: TooltipItem<keyof ChartTypeRegistry>[] = [
      {
        dataset: {
          label: 'Revenue Dataset',
          backgroundColor: '#ff0000',
          borderColor: '#00ff00',
          tooltipData: [[{ key: 'revenue', value: 1000 }]],
          yAxisKey: 'revenue', // Matches item.key
        },
        dataIndex: 0,
        datasetIndex: 0,
      } as unknown as TooltipItem<keyof ChartTypeRegistry>,
    ];

    mockFormatLabel.mockReturnValue('formatted');
    mockGetPercentage.mockReturnValue('30%');

    // Act
    const result = barAndLineTooltipHelper(
      mockDataPoints,
      mockChart,
      mockColumnLabelFormats,
      [],
      false,
      undefined
    );

    // Assert
    expect(result[0].color).toBe('#ff0000'); // Uses backgroundColor since yAxisKey matches
  });

  it('should use undefined color when yAxisKey does not match item key', () => {
    // Arrange
    const mockDataPoints: TooltipItem<keyof ChartTypeRegistry>[] = [
      {
        dataset: {
          label: 'Revenue Dataset',
          backgroundColor: '#ff0000',
          tooltipData: [[{ key: 'revenue', value: 1000 }]],
          yAxisKey: 'different_key', // Does NOT match item.key
        },
        dataIndex: 0,
        datasetIndex: 0,
      } as unknown as TooltipItem<keyof ChartTypeRegistry>,
    ];

    mockFormatLabel.mockReturnValue('formatted');
    mockGetPercentage.mockReturnValue('30%');

    // Act
    const result = barAndLineTooltipHelper(
      mockDataPoints,
      mockChart,
      mockColumnLabelFormats,
      [],
      false,
      undefined
    );

    // Assert
    expect(result[0].color).toBeUndefined(); // Color is undefined when yAxisKey doesn't match
  });

  it('should handle percentage mode with data reversal and usePercentage flags', () => {
    // Arrange
    const mockDataPoints: TooltipItem<keyof ChartTypeRegistry>[] = [
      {
        dataset: {
          label: 'First Dataset',
          backgroundColor: '#ff0000',
          tooltipData: [[{ key: 'revenue', value: 500 }]],
          yAxisKey: 'revenue',
        },
        dataIndex: 0,
        datasetIndex: 0,
      } as unknown as TooltipItem<keyof ChartTypeRegistry>,
      {
        dataset: {
          label: 'percentage_metric', // This should trigger usePercentage via keyToUsePercentage
          backgroundColor: '#00ff00',
          tooltipData: [[{ key: 'percentage', value: 75 }]],
          yAxisKey: 'percentage',
        },
        dataIndex: 0,
        datasetIndex: 1,
      } as unknown as TooltipItem<keyof ChartTypeRegistry>,
    ];

    mockFormatLabel.mockReturnValue('formatted');
    mockGetPercentage.mockReturnValue('40%');

    // Act
    const result = barAndLineTooltipHelper(
      mockDataPoints,
      mockChart,
      mockColumnLabelFormats,
      ['percentage_metric'],
      true,
      'stacked' // percentageMode = 'stacked'
    );

    // Assert
    expect(result).toHaveLength(2);

    // Due to percentageMode='stacked', dataPoints are reversed
    // First result should be from 'percentage_metric' dataset (originally second)
    expect(result[0].usePercentage).toBe(true); // Due to both percentageMode AND keyToUsePercentage
    expect(result[0].formattedLabel).toBe('percentage_metric');

    // Second result should be from 'First Dataset' (originally first)
    expect(result[1].usePercentage).toBe(true); // Due to percentageMode
    expect(result[1].formattedLabel).toBe('First Dataset');

    // Verify getPercentage was called for both items
    expect(mockGetPercentage).toHaveBeenCalledTimes(2);
  });
});
