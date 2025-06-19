import type { BusterMetric, IBusterMetric } from '@/api/asset_interfaces/metric';
import { createDefaultChartConfig } from './messageAutoChartHandler';

export const upgradeMetricToIMetric = (
  metric: BusterMetric,
  oldMetric: IBusterMetric | null | undefined
): IBusterMetric => {
  const chart_config = createDefaultChartConfig(metric);
  return {
    ...oldMetric,
    ...metric,
    chart_config
  };
};
