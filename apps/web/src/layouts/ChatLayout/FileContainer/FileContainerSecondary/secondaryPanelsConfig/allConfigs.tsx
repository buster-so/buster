import type React from 'react';
import type { FileType } from '@/api/asset_interfaces/chat';
import type { FileContainerSecondaryProps } from '../interfaces';
import { DashboardSecondaryRecord } from './dashboardPanels';
import { MetricSecondaryRecord } from './metricPanels';

export const SelectedFileSecondaryRecord: Record<
  FileType,
  Record<string, React.FC<FileContainerSecondaryProps>>
> = {
  metric: MetricSecondaryRecord,
  dashboard: DashboardSecondaryRecord,
  report: {},
  reasoning: {}
};

export const SelectedFileSecondaryRenderRecord: Partial<Record<FileType, Record<string, boolean>>> =
  {};
