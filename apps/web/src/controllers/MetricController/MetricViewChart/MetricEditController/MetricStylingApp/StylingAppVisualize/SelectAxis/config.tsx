import type React from 'react';
import { ChartType, type IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import { Calendar, CurrencyDollar, Numbers, Percentage, Typography } from '@/components/ui/icons';

export const ColumnTypeIcon: Record<
  IColumnLabelFormat['style'],
  {
    icon: React.ReactNode;
    value: IColumnLabelFormat['style'];
    tooltip: string;
  }
> = {
  string: {
    icon: <Typography />,
    value: 'string',
    tooltip: 'Text'
  },
  number: {
    icon: <Numbers />,
    value: 'number',
    tooltip: 'Number'
  },
  date: {
    icon: <Calendar />,
    value: 'date',
    tooltip: 'Date'
  },
  currency: {
    icon: <CurrencyDollar />,
    value: 'currency',
    tooltip: 'Currency'
  },
  percent: {
    icon: <Percentage />,
    value: 'percent',
    tooltip: 'Percent'
  }
};

export enum SelectAxisContainerId {
  Available = 'available',
  XAxis = 'xAxis',
  YAxis = 'yAxis',
  CategoryAxis = 'categoryAxis',
  SizeAxis = 'sizeAxis',
  Tooltip = 'tooltip',
  Y2Axis = 'y2Axis',
  Metric = 'metric'
}

export const zoneIdToAxis: Record<SelectAxisContainerId, string> = {
  [SelectAxisContainerId.Available]: '',
  [SelectAxisContainerId.XAxis]: 'x',
  [SelectAxisContainerId.YAxis]: 'y',
  [SelectAxisContainerId.CategoryAxis]: 'category',
  [SelectAxisContainerId.SizeAxis]: 'size',
  [SelectAxisContainerId.Tooltip]: 'tooltip',
  [SelectAxisContainerId.Y2Axis]: 'y2',
  [SelectAxisContainerId.Metric]: 'metric'
};

export const chartTypeToAxis: Record<
  ChartType,
  'barAndLineAxis' | 'scatterAxis' | 'pieChartAxis' | 'comboChartAxis' | ''
> = {
  [ChartType.Bar]: 'barAndLineAxis',
  [ChartType.Line]: 'barAndLineAxis',
  [ChartType.Scatter]: 'scatterAxis',
  [ChartType.Pie]: 'pieChartAxis',
  [ChartType.Combo]: 'comboChartAxis',
  [ChartType.Metric]: '',
  [ChartType.Table]: ''
};
