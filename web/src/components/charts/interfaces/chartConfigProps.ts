import { ChartType, ViewType } from './enum';
import type { BarAndLineAxis, ComboChartAxis, PieChartAxis, ScatterAxis } from './axisInterfaces';
import type {
  CategoryAxisStyleConfig,
  XAxisConfig,
  Y2AxisConfig,
  YAxisConfig
} from './tickInterfaces';
import type { ShowLegendHeadline, BarSortBy } from './etcInterfaces';
import type { GoalLine, Trendline } from './annotationInterfaces';
import type { ColumnSettings } from './columnInterfaces';
import type { IColumnLabelFormat } from './columnLabelInterfaces';

export type BusterChartConfigProps = {
  selectedChartType: ChartType;
  selectedView: ViewType;

  //COLUMN SETTINGS
  columnSettings?: Record<string, ColumnSettings>; //OPTIONAL because the defaults will be determined by the UI
  columnLabelFormats?: Record<string, IColumnLabelFormat>;
  colors?: string[]; //OPTIONAL: default is the buster color palette
  showLegend?: boolean | null; //OPTIONAL: default is null and will be true if there are multiple Y axes or if a category axis is used
  gridLines?: boolean; //OPTIONAL: default: true
  showLegendHeadline?: ShowLegendHeadline; //OPTIONAL
  goalLines?: GoalLine[]; //OPTIONAL: default is no goal lines
  trendlines?: Trendline[]; //OPTIONAL: default is no trendlines
  disableTooltip?: boolean; //OPTIONAL: default is false
} & YAxisConfig &
  XAxisConfig &
  CategoryAxisStyleConfig &
  Y2AxisConfig &
  BarChartProps &
  LineChartProps &
  ScatterChartProps &
  PieChartProps &
  TableChartProps &
  ComboChartProps &
  MetricChartProps;

type BarChartProps = {
  barAndLineAxis: BarAndLineAxis; // Required for Bar
  barLayout?: 'horizontal' | 'vertical'; //OPTIONAL: default: vertical (column chart)
  barSortBy?: BarSortBy; //OPTIONAL
  barGroupType?: 'stack' | 'group' | 'percentage-stack' | null; //OPTIONAL: default is group. This will only apply if the columnVisualization is set to 'bar'.
  barShowTotalAtTop?: boolean; //OPTIONAL: default is false. This will only apply if is is stacked and there is either a category or multiple y axis applie to the series.
};

type LineChartProps = {
  lineGroupType?: 'stack' | 'percentage-stack' | null; //OPTIONAL: default is null. This will only apply if the columnVisualization is set to 'line'. If this is set to stack it will stack the lines on top of each other. The UI has this labeled as "Show as %"
};

type ScatterChartProps = {
  scatterAxis: ScatterAxis; // Required for Scatter
  scatterDotSize?: [number, number];
};

type PieChartProps = {
  pieChartAxis: PieChartAxis; // Required for Pie
  pieDisplayLabelAs?: 'percent' | 'number'; //OPTIONAL: default: number
  pieShowInnerLabel?: boolean; //OPTIONAL: default true if donut width is set. If the data contains a percentage, set this as false.
  pieInnerLabelAggregate?: 'sum' | 'average' | 'median' | 'max' | 'min' | 'count'; //OPTIONAL: default: sum
  pieInnerLabelTitle?: string; //OPTIONAL: default is null and will be the name of the pieInnerLabelAggregate
  pieLabelPosition?: 'inside' | 'outside' | 'none' | null; //OPTIONAL: default: outside
  pieDonutWidth?: number; //OPTIONAL: default: 55 | range 0-65 | range represents percent size of the donut hole. If user asks for a pie this should be 0
  pieMinimumSlicePercentage?: number; //OPTIONAL: default: 2.5 | range 0-100 | If there are items that are less than this percentage of the pie, they combine to form a single slice.
};

type TableChartProps = {
  tableColumnOrder?: string[] | null;
  tableColumnWidths?: Record<string, number> | null;
  tableHeaderBackgroundColor?: string | null;
  tableHeaderFontColor?: string | null;
  tableColumnFontColor?: string | null;
};

type ComboChartProps = {
  comboChartAxis: ComboChartAxis; // Required for Combo
};

export type MetricChartProps = {
  metricColumnId: string; //the column id to use for the value.
  metricValueAggregate?: 'sum' | 'average' | 'median' | 'max' | 'min' | 'count' | 'first'; //OPTIONAL: default: sum
  metricHeader?: string | DerivedMetricTitle | null; //OPTIONAL: if undefined, the column id will be used and formatted
  metricSubHeader?: string | DerivedMetricTitle | null; //OPTIONAL: default is ''
  metricValueLabel?: string | null; //OPTIONAL: default is null. If null then the metricColumnId will be used in conjunction with the metricValueAggregate. If not null, then the metricValueLabel will be used.
};

export type DerivedMetricTitle = {
  columnId: string; //which column to use.
  useValue: boolean; //whether to display to use the key or the value in the chart
  aggregate?: MetricChartProps['metricValueAggregate']; //OPTIONAL: default is sum
};
