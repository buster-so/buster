import React from 'react';
import { SelectAxisContainerId } from '../config';
import { CategoryAxisSettingContent } from './CategoryAxisSettingContent';
import { XAxisSettingContent } from './XAxisSettingContent';
import { YAxisSettingContent } from './YAxisSettingContent';
import { Y2AxisSettingContent } from './Y2AxisSettingContent';
import { TooltipAxisSettingContent } from './TooltipAxisSettingContent';

export const zoneIdToAxisSettingContent: Record<
  SelectAxisContainerId,
  React.FC<{
    zoneId: SelectAxisContainerId;
  }> | null
> = {
  xAxis: XAxisSettingContent,
  yAxis: YAxisSettingContent,
  categoryAxis: CategoryAxisSettingContent,
  y2Axis: Y2AxisSettingContent,
  tooltip: TooltipAxisSettingContent,
  sizeAxis: null,
  available: null,
  metric: null
};
