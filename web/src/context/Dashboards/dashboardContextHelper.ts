import { BusterDashboardMetric, IBusterDashboardMetric } from '@/api/buster_rest';
import { createDefaultChartConfig } from '../Threads/helpers/messageAutoChartHandler';

export const upgradeDashboardMetric = (
  metric: BusterDashboardMetric,
  oldMetric: IBusterDashboardMetric | undefined
): IBusterDashboardMetric => {
  return {
    ...metric,
    chart_config: createDefaultChartConfig(metric)
  };
};
