import type React from 'react';
import type { ChartType, ColumnLabelFormat } from '@buster/server-shared/metrics';
import { Calendar, CurrencyDollar, Numbers, Percentage, Typography } from '@/components/ui/icons';

export const ColumnTypeIcon: Record<
  ColumnLabelFormat['style'],
  {
    icon: React.ReactNode;
    value: ColumnLabelFormat['style'];
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
  ['bar']: 'barAndLineAxis',
  ['line']: 'barAndLineAxis',
  ['scatter']: 'scatterAxis',
  ['pie']: 'pieChartAxis',
  ['combo']: 'comboChartAxis',
  ['metric']: '',
  ['table']: ''
};
