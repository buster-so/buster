import { DEFAULT_IBUSTER_METRIC, type IBusterMetric } from '@/api/asset_interfaces/metric';

export const resolveEmptyMetric = (
  metric: IBusterMetric | undefined,
  metricId: string
): IBusterMetric => {
  if (!metric || !metric?.id) {
    return { ...DEFAULT_IBUSTER_METRIC, ...metric, id: metricId };
  }
  return metric;
};
