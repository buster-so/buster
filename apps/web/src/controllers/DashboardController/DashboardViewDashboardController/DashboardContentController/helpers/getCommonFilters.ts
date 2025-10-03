import type { MetricFilter } from '@buster/server-shared/metrics';
import type { BusterMetric } from '@/api/asset_interfaces';

/**
 * Finds filters that are common across all metrics in a dashboard
 * A filter is considered common if it exists in ALL metrics with the same configuration
 */
export function getCommonFilters(metrics: Record<string, BusterMetric>): MetricFilter[] {
  const metricsArray = Object.values(metrics);

  if (metricsArray.length === 0) {
    return [];
  }

  // Get filters from first metric as baseline
  const firstMetric = metricsArray[0];
  if (!firstMetric?.filters || firstMetric.filters.length === 0) {
    return [];
  }

  // Find filters that exist in all metrics
  const commonFilters: MetricFilter[] = [];

  for (const filter of firstMetric.filters) {
    // Check if this filter exists in all other metrics
    const isInAllMetrics = metricsArray.every((metric) => {
      if (!metric.filters) {
        return false;
      }

      // Find matching filter by key
      const matchingFilter = metric.filters.find((f) => f.key === filter.key);
      if (!matchingFilter) {
        return false;
      }

      // Verify filter configuration matches (type, mode, column)
      const typeMatch = matchingFilter.type === filter.type;
      const modeMatch = matchingFilter.mode === filter.mode;
      const columnMatch = matchingFilter.column === filter.column;

      return typeMatch && modeMatch && columnMatch;
    });

    if (isInAllMetrics) {
      commonFilters.push(filter);
    }
  }

  return commonFilters;
}
