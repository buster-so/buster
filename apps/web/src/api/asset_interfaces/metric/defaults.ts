import { ShareRole } from '../share/shareInterfaces';
import { VerificationStatus } from '../share/verificationInterfaces';
import { type ColumnLabelFormat, type ColumnSettings } from './charts';
import { DEFAULT_CHART_THEME } from './charts/configColors';
import type { ColumnMetaData } from './interfaces';
import type { IBusterMetric, IBusterMetricChartConfig } from './requireInterfaces';

export const DEFAULT_CHART_CONFIG: IBusterMetricChartConfig = {
  colors: DEFAULT_CHART_THEME,
  selectedChartType: 'table',
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
  xAxisTimeInterval: null,
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
    category: [],
    size: [],
    tooltip: null
  },
  comboChartAxis: {
    x: [],
    y: [],
    y2: [],
    category: [],
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
  pieSortBy: 'value',
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

export const ENABLED_DOTS_ON_LINE_SIZE = 4;
export const DEFAULT_COLUMN_METADATA: ColumnMetaData[] = [];

export const DEFAULT_IBUSTER_METRIC: Required<IBusterMetric> = {
  id: 'DEFAULT_ID',
  type: 'metric',
  name: '',
  version_number: 1,
  description: '',
  time_frame: '',
  sql: null,
  dataset_id: '',
  dataset_name: null,
  error: null,
  data_metadata: null,
  status: VerificationStatus.NOT_REQUESTED,
  evaluation_score: 'Moderate',
  evaluation_summary: '',
  file_name: '',
  file: '',
  data_source_id: '',
  created_at: '',
  updated_at: '',
  sent_by_id: '',
  sent_by_name: '',
  permission: ShareRole.CAN_VIEW,
  sent_by_avatar_url: null,
  dashboards: [],
  collections: [],
  chart_config: DEFAULT_CHART_CONFIG,
  individual_permissions: null,
  public_expiry_date: null,
  public_enabled_by: null,
  publicly_accessible: false,
  public_password: null,
  versions: []
};

export const DEFAULT_TRENDLINE_CONFIG: Required<IBusterMetricChartConfig['trendlines'][number]> = {
  id: 'DEFAULT_ID',
  columnId: '',
  show: true,
  showTrendlineLabel: false,
  trendlineLabel: null,
  type: 'linear_regression',
  trendLineColor: '#FF0000',
  trendlineLabelPositionOffset: 85,
  projection: true,
  lineStyle: 'solid',
  polynomialOrder: 2,
  aggregateAllCategories: true,
  offset: 0
};
