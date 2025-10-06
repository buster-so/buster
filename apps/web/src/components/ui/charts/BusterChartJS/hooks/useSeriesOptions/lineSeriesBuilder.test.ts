import {
  type ChartEncodes,
  type ColumnLabelFormat,
  type ColumnSettings,
  DEFAULT_COLUMN_LABEL_FORMAT,
  DEFAULT_COLUMN_SETTINGS,
  type ScatterAxis,
} from '@buster/server-shared/metrics';
import type { ChartDataset, ScriptableContext } from 'chart.js';
import { describe, expect, it, vi } from 'vitest';
import { formatLabel } from '@/lib/columnFormatter';
import { createDayjsDate } from '@/lib/date';
import type { BusterChartProps } from '../../../BusterChart.types';
import type { DatasetOption, DatasetOptionsWithTicks, KV } from '../../../chartHooks';
import { formatBarAndLineDataLabel } from '../../helpers';
import { lineBuilder, lineSeriesBuilder_labels } from './lineSeriesBuilder';

// Use NonNullable utility type for potentially nullable map types
type ColumnLabelFormatMap = NonNullable<BusterChartProps['columnLabelFormats']>;
type ColumnSettingsMap = NonNullable<BusterChartProps['columnSettings']>;

// Mock dependencies
vi.mock('../../../commonHelpers', () => ({
  formatLabelForDataset: vi.fn((dataset) => dataset.label[0]?.value || dataset.dataKey),
}));

vi.mock('@/lib/colors', () => ({
  addOpacityToColor: vi.fn((color, opacity) =>
    opacity === 1 ? color : `${color}-opacity-${opacity}`
  ),
}));

vi.mock('@/lib/date', () => ({
  createDayjsDate: vi.fn((dateString) => ({
    toDate: () => new Date(dateString),
  })),
}));

vi.mock('@/lib/columnFormatter', () => ({
  formatLabel: vi.fn((value) => `formatted-${value}`),
}));

vi.mock('@/lib/axisFormatter', () => ({
  JOIN_CHARACTER: ' | ',
  JOIN_CHARACTER_DATE: ' ',
}));

vi.mock('../../helpers', () => ({
  formatBarAndLineDataLabel: vi.fn(
    (value, context, percentageMode, columnLabelFormat) =>
      `label-${value}-${percentageMode || 'none'}`
  ),
}));

const mockContext = (
  value: number,
  dataIndex: number,
  datasetIndex: number,
  datasetData: any[],
  scaleType = 'linear',
  chartDatasets: any[] = [{ data: datasetData, hidden: false }]
) =>
  ({
    chart: {
      scales: { x: { type: scaleType } },
      ctx: {
        createLinearGradient: vi.fn(() => ({
          addColorStop: vi.fn(),
        })),
      },
      height: 400,
      data: {
        datasets: chartDatasets,
      },
    },
    dataIndex: dataIndex,
    datasetIndex: datasetIndex,
    dataset: { data: datasetData },
    value: value,
  }) as unknown as ScriptableContext<'line'>;

describe('lineSeriesBuilder', () => {
  // We'll primarily test lineBuilder directly as lineSeriesBuilder is a simple map
  describe('lineBuilder', () => {
    const baseProps = {
      colors: ['#ff0000', '#00ff00', '#0000ff'],
      columnSettings: {
        metric1: {
          ...DEFAULT_COLUMN_SETTINGS,
          showDataLabels: true,
          lineType: 'smooth',
          lineWidth: 2,
          lineSymbolSize: 3,
          lineStyle: 'line',
        },
        metric2: {
          ...DEFAULT_COLUMN_SETTINGS,
          showDataLabels: false,
          lineType: 'normal',
          lineWidth: 1,
          lineSymbolSize: 4,
          lineStyle: 'area',
        } as ColumnSettings,
        metric3: {
          ...DEFAULT_COLUMN_SETTINGS,
          showDataLabels: true,
          lineType: 'step',
          lineWidth: 3,
          lineSymbolSize: 5,
          lineStyle: 'line',
          showDataLabelsAsPercentage: true,
        },
      } as ColumnSettingsMap,
      columnLabelFormats: {
        metric1: {
          ...DEFAULT_COLUMN_LABEL_FORMAT,
          columnType: 'number',
          style: 'number',
        } as ColumnLabelFormat,
        metric2: {
          ...DEFAULT_COLUMN_LABEL_FORMAT,
          columnType: 'number',
          style: 'currency',
          currency: 'USD',
        } as ColumnLabelFormat,
        metric3: {
          ...DEFAULT_COLUMN_LABEL_FORMAT,
          columnType: 'number',
          style: 'percent',
        } as ColumnLabelFormat,
      } as ColumnLabelFormatMap,
      xAxisKeys: ['category'] as ChartEncodes['x'],
      lineGroupType: null,
      index: 0,
      trendlines: [],
      dataset: {
        id: 'm1',
        axisType: 'y' as const,
        dataKey: 'metric1',
        label: [{ key: 'label', value: 'Metric One' }] as KV[],
        data: [10, 20, 15],
        tooltipData: [
          [
            { key: 'label', value: 'point1' },
            { key: 'value', value: 10 },
          ],
          [
            { key: 'label', value: 'point2' },
            { key: 'value', value: 20 },
          ],
          [
            { key: 'label', value: 'point3' },
            { key: 'value', value: 15 },
          ],
        ],
      } as DatasetOption,
    } as Parameters<typeof lineBuilder>[0];

    it('should build a basic line series correctly', () => {
      const result = lineBuilder(baseProps);

      expect(result.type).toBe('line');
      expect(result.yAxisID).toBe('y');
      expect(result.label).toBe('Metric One');
      expect(result.fill).toBe(false);
      expect(result.tension).toBe(0.375);
      expect(result.stepped).toBe(false);
      expect(result.spanGaps).toBe(true);
      expect(result.yAxisKey).toBe('metric1');
      expect(result.borderWidth).toBe(2);
      expect(result.order).toBe(0);
      expect(result.data).toEqual([10, 20, 15]);
      expect(result.borderColor).toBe('#ff0000');
      expect(result.pointBorderColor).toBe('#ff0000');
      expect(result.pointRadius).toBe(3);
      expect(result.pointHoverRadius).toBe(3);
      expect(result.pointBorderWidth).toBe(1.2);
      expect(result.pointHoverBorderWidth).toBe(1.65);
      expect(result.tooltipData).toEqual(baseProps.dataset.tooltipData);
      expect(result.xAxisKeys).toEqual(['category']);

      expect(result.datalabels?.display).toBeInstanceOf(Function);
      expect(result.datalabels?.formatter).toBeInstanceOf(Function);
      if (typeof result.datalabels?.formatter === 'function') {
        expect(result.datalabels.formatter(10, mockContext(10, 0, 0, baseProps.dataset.data))).toBe(
          'label-10-none'
        );
      }
      expect(result.datalabels?.anchor).toBe('end');
      expect(result.datalabels?.align).toBe('top');
    });

    it('should configure as an area chart when lineStyle is area', () => {
      const datasetMetric2: DatasetOption = {
        ...baseProps.dataset,
        id: 'm2',
        dataKey: 'metric2',
        label: [{ key: 'label', value: 'Metric Two' }],
      };
      const props = { ...baseProps, index: 1, dataset: datasetMetric2 };
      const result = lineBuilder(props);

      expect(result.yAxisKey).toBe('metric2');
      expect(result.label).toBe('Metric Two');
      expect(result.fill).toBe('-1');
      expect(result.tension).toBe(0);
      expect(result.borderColor).toBe('#00ff00');
      expect(result.backgroundColor).toBeInstanceOf(Function);
      expect(result.pointRadius).toBe(4);
      expect(result.pointHoverRadius).toBe(4);
      expect(result.datalabels?.display).toBe(false);
    });

    it('should configure as a stacked area chart when lineGroupType is percentage-stack', () => {
      const props = { ...baseProps, lineGroupType: 'percentage-stack' as const, index: 0 };
      const result = lineBuilder(props);

      expect(result.fill).toBe('origin');
      expect(result.backgroundColor).toBeInstanceOf(Function);
      expect(result.datalabels?.anchor).toBe('start');
      expect(result.datalabels?.align).toBe('bottom');
      if (typeof result.datalabels?.formatter === 'function') {
        const context = mockContext(10, 0, 0, baseProps.dataset.data);
        expect(result.datalabels.formatter(10, context)).toBe('label-10-stacked');
        expect(formatBarAndLineDataLabel).toHaveBeenCalledWith(
          10,
          context,
          'stacked',
          baseProps.columnLabelFormats.metric1
        );
      }
    });

    it('should configure datalabels for percentage display when showDataLabelsAsPercentage is true', () => {
      const datasetMetric3: DatasetOption = {
        ...baseProps.dataset,
        id: 'm3',
        dataKey: 'metric3',
        label: [{ key: 'label', value: 'Metric Three' }],
      };
      const props = { ...baseProps, index: 2, dataset: datasetMetric3 };
      const result = lineBuilder(props);

      expect(result.yAxisKey).toBe('metric3');
      expect(result.label).toBe('Metric Three');
      expect(result.tension).toBe(0);
      expect(result.stepped).toBe(true);
      expect(result.borderColor).toBe('#0000ff');
      expect(result.pointRadius).toBe(5);
      expect(result.pointHoverRadius).toBe(5);
      expect(result.datalabels?.color).toBe('white');
      if (typeof result.datalabels?.formatter === 'function') {
        const context = mockContext(15, 2, 0, baseProps.dataset.data);
        expect(result.datalabels.formatter(15, context)).toBe('label-15-data-label');
        expect(formatBarAndLineDataLabel).toHaveBeenCalledWith(
          15,
          context,
          'data-label',
          baseProps.columnLabelFormats.metric3
        );
      }
    });

    it('should hide last data label if x-axis scale type is time', () => {
      const props = { ...baseProps };
      const result = lineBuilder(props);
      const contextWithTimeScale = mockContext(15, 2, 0, props.dataset.data, 'time');
      const contextNotLast = mockContext(10, 0, 0, props.dataset.data, 'time');

      expect(result.datalabels?.display).toBeInstanceOf(Function);
      if (typeof result.datalabels?.display === 'function') {
        expect(result.datalabels.display(contextNotLast)).toBe('auto');
        expect(result.datalabels.display(contextWithTimeScale)).toBe(false);
      }
    });
  });

  describe('lineSeriesBuilder_labels', () => {
    const baseProps = {
      datasetOptions: {
        ticksKey: [
          { key: 'date', value: 'Date' },
          { key: 'category', value: 'Category' },
        ] as KV[],
        ticks: [
          ['2023-01-01', 'A'],
          ['2023-01-02', 'B'],
          ['2023-01-03', 'A'],
        ],
        datasets: [],
      } as DatasetOptionsWithTicks,
      columnLabelFormats: {
        date: {
          ...DEFAULT_COLUMN_LABEL_FORMAT,
          columnType: 'date',
          style: 'date',
        } as ColumnLabelFormat,
        category: {
          ...DEFAULT_COLUMN_LABEL_FORMAT,
          columnType: 'text',
          style: 'string',
        } as ColumnLabelFormat,
      } as ColumnLabelFormatMap,
      columnSettings: {} as ColumnSettingsMap,
      sizeKey: [] as ScatterAxis['size'],
      trendlineSeries: [] as ChartDataset<'line'>[],
      colors: [],
    };

    it('should create date labels correctly when specified', () => {
      const props = {
        ...baseProps,
        xAxisKeys: ['date'] as ChartEncodes['x'],
        datasetOptions: {
          ...baseProps.datasetOptions,
          ticks: [['2023-01-01'], ['2023-01-02'], ['2023-01-03']],
        },
      };
      const labels = lineSeriesBuilder_labels(props);
      expect(props.datasetOptions.ticks).toHaveLength(3);
      expect(labels).toHaveLength(3);
      expect(typeof labels[0]).not.toBe('string');
      expect(createDayjsDate).toHaveBeenCalledWith('2023-01-01');
      expect(createDayjsDate).toHaveBeenCalledWith('2023-01-02');
      expect(createDayjsDate).toHaveBeenCalledWith('2023-01-03');
    });

    it('should create combined string labels correctly', () => {
      const props = { ...baseProps, xAxisKeys: ['date', 'category'] as ChartEncodes['x'] };
      const labels = lineSeriesBuilder_labels(props);

      expect(labels).toHaveLength(3);
      console.log('labels', labels[0]);
      expect(labels[0]).toBe('formatted-2023-01-01 formatted-A');
      expect(labels[1]).toBe('formatted-2023-01-02 formatted-B');
      expect(labels[2]).toBe('formatted-2023-01-03 formatted-A');
      expect(formatLabel).toHaveBeenCalledWith('2023-01-01', props.columnLabelFormats.date);
      expect(formatLabel).toHaveBeenCalledWith('A', props.columnLabelFormats.category);
      expect(formatLabel).toHaveBeenCalledWith('B', props.columnLabelFormats.category);
    });

    it('should handle single non-date x-axis key', () => {
      const props = { ...baseProps, xAxisKeys: ['category'] as ChartEncodes['x'] };
      const labels = lineSeriesBuilder_labels(props);

      expect(labels).toHaveLength(3);
      expect(labels[0]).toBe('formatted-2023-01-01 formatted-A');
      expect(labels[1]).toBe('formatted-2023-01-02 formatted-B');
      expect(labels[2]).toBe('formatted-2023-01-03 formatted-A');
      expect(formatLabel).toHaveBeenCalledWith('A', props.columnLabelFormats.category);
      expect(formatLabel).toHaveBeenCalledWith('B', props.columnLabelFormats.category);
      expect(formatLabel).toHaveBeenCalledWith('2023-01-01', props.columnLabelFormats.date);
    });
  });
});
