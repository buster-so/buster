import type React from 'react';
import type { SelectAxisContainerId } from '../config';
import { CategoryAxisSettingContent } from './CategoryAxisSettingContent';
import { TooltipAxisSettingContent } from './TooltipAxisSettingContent';
import { XAxisSettingContent } from './XAxisSettingContent';
import { Y2AxisSettingContent } from './Y2AxisSettingContent';
import { YAxisSettingContent } from './YAxisSettingContent';

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
  colorBy: null,
  available: null,
  metric: null,
};
