import {
  ChartEncodes,
  ChartType,
  ColumnMetaData,
  IBusterMetricChartConfig
} from '@/api/asset_interfaces/metric';

export interface SelectChartTypeProps {
  selectedChartType: ChartType;
  lineGroupType: IBusterMetricChartConfig['lineGroupType'];
  barGroupType: IBusterMetricChartConfig['barGroupType'];
  barLayout: IBusterMetricChartConfig['barLayout'];
  colors: string[];
  columnMetadata: ColumnMetaData[];
  columnSettings: IBusterMetricChartConfig['columnSettings'];
  selectedAxis: ChartEncodes;
}
