import type { FileType } from '@/api/asset_interfaces/chat';
import type { FileContainerSecondaryProps } from '../interfaces';
import type React from 'react';
import { MetricSecondaryRecord } from './metricPanels';
import { DashboardSecondaryRecord } from './dashboardPanels';

export const SelectedFileSecondaryRecord: Record<
  FileType,
  Record<string, React.FC<FileContainerSecondaryProps>>
> = {
  metric: MetricSecondaryRecord,
  dashboard: DashboardSecondaryRecord,
  reasoning: {}
};

export const SelectedFileSecondaryRenderRecord: Partial<Record<FileType, Record<string, boolean>>> =
  {};
