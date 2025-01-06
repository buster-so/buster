import type { IBusterThreadMessageChartConfig } from '../../../api/busterv2/threads/threadConfigInterfaces';
import type { ColumnSettings } from '../../../components/charts/interfaces/columnInterfaces';
import { ChartType, ViewType } from '../../../components/charts/interfaces/enum';
import { DEFAULT_CHART_THEME } from '../../../components/charts/configColors';
import type { ColumnLabelFormat } from '../../../components/charts/interfaces/columnLabelInterfaces';
import { ColumnMetaData } from './interfaces';

export const DEFAULT_CHART_CONFIG: IBusterThreadMessageChartConfig = {
  colors: DEFAULT_CHART_THEME,
  selectedChartType: ChartType.Table,
  selectedView: ViewType.Table,
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
  barAndLineAxis: {
    x: [],
    y: [],
    category: [],
    tooltip: null
  },
  scatterAxis: {
    x: [],
    y: [],
    size: [],
    tooltip: null
  },
  comboChartAxis: {
    x: [],
    y: [],
    y2: [],
    tooltip: null
  },
  pieChartAxis: {
    x: [],
    y: [],
    tooltip: null
  },
  //LINE
  lineGroupType: null,
  //SCATTER
  scatterDotSize: [3, 15],
  //BAR
  barSortBy: [],
  barLayout: 'vertical',
  barGroupType: 'group',
  barShowTotalAtTop: false,
  //PIE
  pieShowInnerLabel: true,
  pieInnerLabelAggregate: 'sum',
  pieInnerLabelTitle: 'Total',
  pieLabelPosition: null,
  pieDonutWidth: 40,
  pieMinimumSlicePercentage: 0,
  pieDisplayLabelAs: 'number',
  //METRIC
  metricColumnId: '',
  metricValueAggregate: 'sum',
  metricHeader: null,
  metricSubHeader: null,
  metricValueLabel: null,
  //TABLE
  tableColumnOrder: null,
  tableColumnWidths: null,
  tableHeaderBackgroundColor: null,
  tableHeaderFontColor: null,
  tableColumnFontColor: null,
  //MUST LOOP THROUGH ALL COLUMNS
  columnSettings: {},
  columnLabelFormats: {}
};

export const DEFAULT_COLUMN_SETTINGS: Required<ColumnSettings> = {
  showDataLabels: false,
  columnVisualization: 'bar',
  lineWidth: 2,
  lineStyle: 'line',
  lineType: 'normal',
  lineSymbolSize: 0,
  barRoundness: 8,
  showDataLabelsAsPercentage: false
};

export const DEFAULT_COLUMN_LABEL_FORMAT: Required<ColumnLabelFormat> = {
  style: 'string',
  compactNumbers: false,
  columnType: 'string',
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
  replaceMissingDataWith: 0,
  makeLabelHumanReadable: true
};

export const ENABLED_DOTS_ON_LINE = 3.5;

export const DEFAULT_CHART_CONFIG_ENTRIES = Object.entries(DEFAULT_CHART_CONFIG);

export const DEFAULT_BAR_ROUNDNESS = DEFAULT_COLUMN_SETTINGS.barRoundness;

export const MIN_DONUT_WIDTH = 15;

export const DEFAULT_DAY_OF_WEEK_FORMAT = 'ddd';
export const DEFAULT_DATE_FORMAT_DAY_OF_WEEK = 'dddd';
export const DEFAULT_DATE_FORMAT_MONTH_OF_YEAR = 'MMMM';
export const DEFAULT_DATE_FORMAT_QUARTER = 'YYYY [Q]Q';

export const ENABLED_DOTS_ON_LINE_SIZE = 8;

export const DEFAULT_COLUMN_METADATA: ColumnMetaData[] = [];
