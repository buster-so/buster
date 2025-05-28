import {
  ChartType,
  DEFAULT_CHART_CONFIG,
  type DataMetadata,
  type IBusterMetricChartConfig
} from '@/api/asset_interfaces/metric';
import { createDefaultChartConfig } from '.';

describe('createDefaultChartConfig', () => {
  it('should create a default chart config', () => {
    const message = {
      chart_config: DEFAULT_CHART_CONFIG,
      data_metadata: TEST_DATA_METADATA
    };

    const config = createDefaultChartConfig(message);

    const expected = {
      colors: [
        '#B399FD',
        '#FC8497',
        '#FBBC30',
        '#279EFF',
        '#E83562',
        '#41F8FF',
        '#F3864F',
        '#C82184',
        '#31FCB4',
        '#E83562'
      ],
      selectedChartType: ChartType.Table,
      yAxisShowAxisLabel: true,
      yAxisShowAxisTitle: true,
      yAxisAxisTitle: null,
      yAxisStartAxisAtZero: null,
      yAxisScaleType: 'linear',
      y2AxisShowAxisLabel: true,
      y2AxisAxisTitle: null,
      y2AxisShowAxisTitle: true,
      y2AxisStartAxisAtZero: true,
      y2AxisScaleType: 'linear',
      xAxisShowAxisLabel: true,
      xAxisShowAxisTitle: true,
      xAxisAxisTitle: null,
      xAxisLabelRotation: 'auto',
      xAxisDataZoom: false,
      categoryAxisTitle: null,
      showLegend: null,
      gridLines: true,
      goalLines: [],
      trendlines: [],
      showLegendHeadline: false,
      disableTooltip: false,
      barAndLineAxis: { x: [], y: [], tooltip: null, category: [] },
      scatterAxis: { x: [], y: [], size: [], tooltip: null, category: undefined },
      comboChartAxis: { x: [], y: [], y2: [], tooltip: null, category: undefined },
      pieChartAxis: { x: [], y: [], tooltip: null },
      lineGroupType: null,
      scatterDotSize: [3, 15],
      barSortBy: [],
      barLayout: 'vertical',
      barGroupType: 'group',
      barShowTotalAtTop: false,
      pieShowInnerLabel: true,
      pieInnerLabelAggregate: 'sum',
      pieInnerLabelTitle: 'Total',
      pieLabelPosition: null,
      pieDonutWidth: 40,
      pieMinimumSlicePercentage: 0,
      pieDisplayLabelAs: 'number',
      pieSortBy: 'value',
      metricColumnId: 'test',
      metricValueAggregate: 'sum',
      metricHeader: null,
      metricSubHeader: null,
      metricValueLabel: null,
      tableColumnOrder: null,
      tableColumnWidths: null,
      tableHeaderBackgroundColor: null,
      tableHeaderFontColor: null,
      tableColumnFontColor: null,
      xAxisTimeInterval: null,
      columnSettings: {
        test: {
          showDataLabels: false,
          columnVisualization: 'bar',
          lineWidth: 2,
          lineStyle: 'line',
          lineType: 'normal',
          lineSymbolSize: 0,
          barRoundness: 8,
          showDataLabelsAsPercentage: false
        }
      },
      columnLabelFormats: {
        test: {
          style: 'string',
          compactNumbers: false,
          columnType: 'text',
          displayName: '',
          numberSeparatorStyle: ',',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
          currency: 'USD',
          convertNumberTo: null,
          dateFormat: 'auto',
          useRelativeTime: false,
          isUTC: false,
          multiplier: 1,
          prefix: '',
          suffix: '',
          replaceMissingDataWith: null,
          makeLabelHumanReadable: true
        }
      }
    } satisfies IBusterMetricChartConfig;

    expect(config).toEqual(expected);
  });

  it('should handle undefined y2 value in comboChartAxis', () => {
    const message = {
      chart_config: {
        ...DEFAULT_CHART_CONFIG,
        comboChartAxis: { x: [], y: [], y2: undefined, tooltip: null, category: undefined }
      },
      data_metadata: TEST_DATA_METADATA
    };

    const config = createDefaultChartConfig(message);

    expect(config.comboChartAxis.y2).toEqual([]);
  });

  it('should handle empty y2 array in comboChartAxis', () => {
    const message = {
      chart_config: {
        ...DEFAULT_CHART_CONFIG,
        comboChartAxis: { x: [], y: [], y2: [], tooltip: null, category: undefined }
      },
      data_metadata: TEST_DATA_METADATA
    };

    const config = createDefaultChartConfig(message);

    expect(config.comboChartAxis.y2).toEqual([]);
  });

  it('should handle null y2 in comboChartAxis', () => {
    const message = {
      chart_config: {
        ...DEFAULT_CHART_CONFIG,
        comboChartAxis: { x: [], y: [], y2: null, tooltip: null, category: undefined }
      },
      data_metadata: TEST_DATA_METADATA
    } as any;

    const config = createDefaultChartConfig(message);

    expect(config.comboChartAxis.y2).toEqual([]);
  });

  it('should maintain non-empty y2 array in comboChartAxis', () => {
    const message = {
      chart_config: {
        ...DEFAULT_CHART_CONFIG,
        comboChartAxis: { x: [], y: [], y2: ['test-y2'], tooltip: null, category: undefined }
      },
      data_metadata: TEST_DATA_METADATA
    };

    const config = createDefaultChartConfig(message);

    expect(config.comboChartAxis.y2).toEqual(['test-y2']);
  });
});

const TEST_DATA_METADATA: DataMetadata = {
  column_count: 1,
  column_metadata: [
    {
      name: 'test',
      simple_type: 'text',
      min_value: 0,
      max_value: 100,
      unique_values: 10,
      type: 'text'
    }
  ],
  row_count: 10
};
