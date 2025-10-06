import type { ColumnLabelFormat } from '@buster/server-shared/metrics';
import type { ChartData } from 'chart.js';
import { describe, expect, it, vi } from 'vitest';
import { determineFontColorContrast } from '@/lib/colors';
import type { ChartSpecificOptionsProps } from './interfaces';
import { pieOptionsHandler, piePluginsHandler } from './pieChartOptions';

vi.mock('@/lib/colors');

const mockChartData: ChartData = {
  labels: ['Test'],
  datasets: [
    {
      data: [1],
      label: 'Test Dataset',
      type: 'pie',
      tooltipData: [],
      xAxisKeys: ['category'],
      yAxisKey: 'value',
    },
  ],
};

describe('pieOptionsHandler', () => {
  it('should return correct cutout percentage when pieDonutWidth is provided', () => {
    const props: ChartSpecificOptionsProps = {
      pieDonutWidth: 10,
      pieShowInnerLabel: false,
      pieInnerLabelTitle: '',
      pieInnerLabelAggregate: 'sum',
      pieLabelPosition: 'inside',
      pieDisplayLabelAs: 'number',
      selectedAxis: {
        y: ['value'],
        x: ['category'],
        category: [],
        tooltip: null,
        colorBy: null,
      } as ChartSpecificOptionsProps['selectedAxis'],
      columnLabelFormats: {},
      barShowTotalAtTop: false,
      columnSettings: {},
      barGroupType: 'stack',
      data: mockChartData,
    };

    const result = pieOptionsHandler(props);
    // Using type assertion since we know the shape of the result
    expect((result as any).cutout).toBe('45%'); // 10 + 35 = 45%
  });
});

describe('piePluginsHandler', () => {
  it('should return correct plugin configuration for inner label display', () => {
    const props: ChartSpecificOptionsProps = {
      pieInnerLabelTitle: 'Total',
      pieShowInnerLabel: true,
      pieDonutWidth: 20,
      pieInnerLabelAggregate: 'sum',
      pieLabelPosition: 'inside',
      pieDisplayLabelAs: 'number',
      selectedAxis: {
        y: ['value'],
        x: ['category'],
        category: [],
        tooltip: null,
        colorBy: null,
      } as ChartSpecificOptionsProps['selectedAxis'],
      columnLabelFormats: {
        value: { columnType: 'number', style: 'number' } as any,
      },
      barShowTotalAtTop: false,
      columnSettings: {},
      barGroupType: 'stack',
      data: mockChartData,
    };

    const result = piePluginsHandler(props);

    expect(result?.annotation).toBeDefined();
    // Using type assertion since we know the shape of the annotation plugin
    const annotations = (result?.annotation?.annotations as any)?.donutInnerLabel;
    expect(annotations).toBeDefined();
    expect(annotations?.display).toBe(true);
  });

  it('should configure datalabels plugin correctly for inside position', () => {
    const mockDetermineFontColorContrast = determineFontColorContrast as any;
    mockDetermineFontColorContrast.mockReturnValue('#ffffff');

    const props: ChartSpecificOptionsProps = {
      pieInnerLabelTitle: '',
      pieShowInnerLabel: false,
      pieDonutWidth: 0,
      pieInnerLabelAggregate: 'sum',
      pieLabelPosition: 'inside',
      pieDisplayLabelAs: 'number',
      selectedAxis: {
        y: ['value'],
        x: ['category'],
        category: [],
        tooltip: null,
        colorBy: null,
      } as ChartSpecificOptionsProps['selectedAxis'],
      columnLabelFormats: {
        value: { columnType: 'number', style: 'number' } as ColumnLabelFormat,
      },
      barShowTotalAtTop: false,
      columnSettings: {},
      barGroupType: 'stack',
      data: mockChartData,
    };

    const result = piePluginsHandler(props);

    expect(result?.datalabels).toBeDefined();
    expect(result?.datalabels?.display).toBe('auto');
    expect(result?.datalabels?.anchor).toBe('center');
  });
});
