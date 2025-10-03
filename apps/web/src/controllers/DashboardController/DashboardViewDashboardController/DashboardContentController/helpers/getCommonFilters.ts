import type { MetricFilter } from '@buster/server-shared/metrics';
import type { BusterMetric } from '@/api/asset_interfaces';

/**
 * Finds filters that are common across all metrics in a dashboard
 * A filter is considered common if it exists in ALL metrics with the same configuration
 */
export function getCommonFilters(metrics: Record<string, BusterMetric>): MetricFilter[] {
  const metricsArray = Object.values(metrics);

  console.log('getCommonFilters - Total metrics:', metricsArray.length);
  metricsArray.forEach((m, i) => {
    console.log(`  Metric ${i} (${m.name}):`, m.filters?.length || 0, 'filters', m.filters);
  });

  if (metricsArray.length === 0) {
    console.log('No metrics, returning empty');
    return [];
  }

  // Get filters from first metric as baseline
  const firstMetric = metricsArray[0];
  if (!firstMetric?.filters || firstMetric.filters.length === 0) {
    console.log('First metric has no filters');
    return [];
  }

  // Find filters that exist in all metrics
  const commonFilters: MetricFilter[] = [];

  for (const filter of firstMetric.filters) {
    console.log(`\nChecking filter "${filter.key}"...`);

    // Check if this filter exists in all other metrics
    const isInAllMetrics = metricsArray.every((metric, idx) => {
      if (!metric.filters) {
        console.log(`  ✗ Metric ${idx} has no filters`);
        return false;
      }

      // Find matching filter by key
      const matchingFilter = metric.filters.find((f) => f.key === filter.key);
      if (!matchingFilter) {
        console.log(`  ✗ Metric ${idx} (${metric.name}) missing key "${filter.key}"`);
        return false;
      }

      // Verify filter configuration matches (type, mode, column)
      const typeMatch = matchingFilter.type === filter.type;
      const modeMatch = matchingFilter.mode === filter.mode;
      const columnMatch = matchingFilter.column === filter.column;

      if (!typeMatch || !modeMatch || !columnMatch) {
        console.log(`  ✗ Metric ${idx} (${metric.name}) config mismatch:`, {
          type: typeMatch ? '✓' : `✗ ${matchingFilter.type} vs ${filter.type}`,
          mode: modeMatch ? '✓' : `✗ ${matchingFilter.mode} vs ${filter.mode}`,
          column: columnMatch ? '✓' : `✗ ${matchingFilter.column} vs ${filter.column}`,
        });
      }

      return typeMatch && modeMatch && columnMatch;
    });

    if (isInAllMetrics) {
      console.log(`  ✓ "${filter.key}" is COMMON!`);
      commonFilters.push(filter);
    }
  }

  console.log('\nFinal common filters:', commonFilters.length, commonFilters);
  return commonFilters;
}
