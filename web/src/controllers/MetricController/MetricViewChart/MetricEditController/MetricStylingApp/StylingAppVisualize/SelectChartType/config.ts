import type React from 'react';
import { ChartIcon_Combo } from '../ChartIcons/ChartIcon_Combo';
import { ChartIcon_Line } from '../ChartIcons/ChartIcon_Line';
import { ChartIcon_Metric } from '../ChartIcons/ChartIcon_Metric';
import { ChartIcon_Pie } from '../ChartIcons/ChartIcon_Pie';
import { ChartIcon_StackedBar } from '../ChartIcons/ChartIcon_StackedBar';
import { ChartIcon_StackedColumn } from '../ChartIcons/ChartIcon_StackedColumn';
import { ChartIcon_Table } from '../ChartIcons/ChartIcon_Table';
import { ChartIcon_Area } from '../ChartIcons/ChartIcon_Area';
import { ChartIcon_Scatter } from '../ChartIcons/ChartIcon_Scatter';
import { ChartIcon_GroupedColumn } from '../ChartIcons/ChartIcon_GroupedColumn';
import { ChartIcon_StackedColumnRelative } from '../ChartIcons/ChartIcon_StackedColumnRelative';
import { ChartIcon_GroupedBar } from '../ChartIcons/ChartIcon_GroupedBar';
import { ChartIcon_StackedBarRelative } from '../ChartIcons/ChartIcon_StackedBarRelative';
import { ChartIcon_AreaRelative } from '../ChartIcons/ChartIcon_AreaRelative';

export enum ChartIconType {
  COLUMN = 'column',
  STACKED_COLUMN = 'stackedColumn',
  RELATIVE_STACKED_COLUMN = 'relativeStackedColumn',
  LINE = 'line',
  COMBO = 'combo',
  TABLE = 'table',
  BAR = 'bar',
  STACKED_BAR = 'stackedBar',
  RELATIVE_STACKED_BAR = 'relativeStackedBar',
  AREA = 'area',
  RELATIVE_AREA = 'relativeArea',
  SCATTER = 'scatter',
  PIE = 'pie',
  METRIC = 'metric'
}

export const CHART_ICON_LIST: {
  id: ChartIconType;
  icon: React.FC<{ colors?: string[] }>;
  tooltipText: string;
}[] = [
  { id: ChartIconType.COLUMN, icon: ChartIcon_GroupedColumn, tooltipText: 'Grouped Column' },
  {
    id: ChartIconType.STACKED_COLUMN,
    icon: ChartIcon_StackedColumn,
    tooltipText: 'Stacked Column'
  },
  {
    id: ChartIconType.RELATIVE_STACKED_COLUMN,
    icon: ChartIcon_StackedColumnRelative,
    tooltipText: 'Relative Stacked Column'
  },
  { id: ChartIconType.LINE, icon: ChartIcon_Line, tooltipText: 'Line' },
  { id: ChartIconType.COMBO, icon: ChartIcon_Combo, tooltipText: 'Combo' },
  { id: ChartIconType.TABLE, icon: ChartIcon_Table, tooltipText: 'Table' },
  { id: ChartIconType.BAR, icon: ChartIcon_GroupedBar, tooltipText: 'Grouped Bar' },
  { id: ChartIconType.STACKED_BAR, icon: ChartIcon_StackedBar, tooltipText: 'Stacked Bar' },
  {
    id: ChartIconType.RELATIVE_STACKED_BAR,
    icon: ChartIcon_StackedBarRelative,
    tooltipText: 'Percent Stacked Bar'
  },
  { id: ChartIconType.AREA, icon: ChartIcon_Area, tooltipText: 'Area' },
  {
    id: ChartIconType.RELATIVE_AREA,
    icon: ChartIcon_AreaRelative,
    tooltipText: 'Percent Stacked Area'
  },
  { id: ChartIconType.SCATTER, icon: ChartIcon_Scatter, tooltipText: 'Scatter' },
  { id: ChartIconType.PIE, icon: ChartIcon_Pie, tooltipText: 'Pie' },
  { id: ChartIconType.METRIC, icon: ChartIcon_Metric, tooltipText: 'Metric' }
];

export const DETERMINE_SELECTED_CHART_TYPE_ORDER: readonly ChartIconType[] = [
  ChartIconType.TABLE,
  ChartIconType.COLUMN,
  ChartIconType.STACKED_COLUMN,
  ChartIconType.RELATIVE_STACKED_COLUMN,
  ChartIconType.LINE,
  ChartIconType.COMBO,
  ChartIconType.BAR,
  ChartIconType.STACKED_BAR,
  ChartIconType.RELATIVE_STACKED_BAR,
  ChartIconType.AREA,
  ChartIconType.RELATIVE_AREA,
  ChartIconType.SCATTER,
  ChartIconType.PIE,
  ChartIconType.METRIC
];
