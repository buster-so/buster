import type { ChartEncodes, ChartType, ColumnLabelFormat } from '@buster/server-shared/metrics';
import type React from 'react';
import Calendar from '@/components/ui/icons/NucleoIconOutlined/calendar';
import CurrencyDollar from '@/components/ui/icons/NucleoIconOutlined/currency-dollar';
import Numbers from '@/components/ui/icons/NucleoIconOutlined/numbers';
import Percentage from '@/components/ui/icons/NucleoIconOutlined/percentage';
import Typography from '@/components/ui/icons/NucleoIconOutlined/typography';

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
    tooltip: 'Text',
  },
  number: {
    icon: <Numbers />,
    value: 'number',
    tooltip: 'Number',
  },
  date: {
    icon: <Calendar />,
    value: 'date',
    tooltip: 'Date',
  },
  currency: {
    icon: <CurrencyDollar />,
    value: 'currency',
    tooltip: 'Currency',
  },
  percent: {
    icon: <Percentage />,
    value: 'percent',
    tooltip: 'Percent',
  },
};

export enum SelectAxisContainerId {
  Available = 'available',
  XAxis = 'xAxis',
  YAxis = 'yAxis',
  CategoryAxis = 'categoryAxis',
  SizeAxis = 'sizeAxis',
  Tooltip = 'tooltip',
  Y2Axis = 'y2Axis',
  Metric = 'metric',
  ColorBy = 'colorBy',
}

// Extract all possible keys from any schema in the ChartEncodes union
export type AllChartEncodesAxisKeys = ChartEncodes extends infer U
  ? U extends Record<string, unknown>
    ? keyof U
    : never
  : never;

export const zoneIdToAxis: Record<SelectAxisContainerId, AllChartEncodesAxisKeys | 'metric' | ''> =
  {
    [SelectAxisContainerId.Available]: '',
    [SelectAxisContainerId.XAxis]: 'x',
    [SelectAxisContainerId.YAxis]: 'y',
    [SelectAxisContainerId.CategoryAxis]: 'category',
    [SelectAxisContainerId.SizeAxis]: 'size',
    [SelectAxisContainerId.Tooltip]: 'tooltip',
    [SelectAxisContainerId.Y2Axis]: 'y2',
    [SelectAxisContainerId.Metric]: 'metric',
    [SelectAxisContainerId.ColorBy]: 'colorBy',
  };

export const chartTypeToAxis: Record<
  ChartType,
  'barAndLineAxis' | 'scatterAxis' | 'pieChartAxis' | 'comboChartAxis' | ''
> = {
  bar: 'barAndLineAxis',
  line: 'barAndLineAxis',
  scatter: 'scatterAxis',
  pie: 'pieChartAxis',
  combo: 'comboChartAxis',
  metric: '',
  table: '',
};
