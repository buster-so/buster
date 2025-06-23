import type { BusterDashboard } from '@/api/asset_interfaces/dashboard';
import { addMetricToDashboardConfig } from './addMetricToDashboard';
import { removeMetricFromDashboardConfig } from './removeMetricFromDashboard';

export const addAndRemoveMetricsToDashboard = (
  metricIds: string[],
  existingConfig: BusterDashboard['config']
): BusterDashboard['config'] => {
  // Get all existing metric IDs from the dashboard
  const existingMetricIds = new Set(
    existingConfig.rows?.flatMap((row) => row.items.map((item) => item.id)) || []
  );

  // Determine which metrics to add and remove
  const metricsToAdd = metricIds.filter((id) => !existingMetricIds.has(id));
  const metricsToRemove = Array.from(existingMetricIds).filter((id) => !metricIds.includes(id));

  // If no changes needed, return existing config
  if (metricsToAdd.length === 0 && metricsToRemove.length === 0) {
    return existingConfig;
  }

  // First remove metrics if any
  const configAfterRemoval =
    metricsToRemove.length > 0
      ? removeMetricFromDashboardConfig(metricsToRemove, existingConfig)
      : existingConfig;

  // Then add new metrics if any
  const finalConfig =
    metricsToAdd.length > 0
      ? addMetricToDashboardConfig(metricsToAdd, configAfterRemoval)
      : configAfterRemoval;

  return finalConfig;
};
