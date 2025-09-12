import type { BusterDashboard } from '@/api/asset_interfaces/dashboard';
import { MAX_NUMBER_OF_ITEMS, NUMBER_OF_COLUMNS } from '../../../asset_interfaces/dashboard/config';
import { getNextRowId } from './dashboardRowUtils';

export const addMetricToDashboardConfig = (
  metricIds: string[],
  existingConfig: BusterDashboard['config']
) => {
  // Create a new config object to avoid mutating the original
  const newConfig = {
    ...existingConfig,
    rows: [...(existingConfig.rows || [])],
  };

  // Filter out metrics that are already in the dashboard
  const newMetricIds = metricIds.filter((metricId) => {
    return !newConfig.rows?.some((row) => row.items.some((item) => item.id === metricId));
  });

  if (newMetricIds.length === 0) {
    return existingConfig;
  }

  // Calculate how many rows we need
  const totalNewMetrics = newMetricIds.length;
  const metricsPerRow = MAX_NUMBER_OF_ITEMS;
  const numRowsNeeded = Math.ceil(totalNewMetrics / metricsPerRow);

  // Create new rows for the metrics
  for (let i = 0; i < numRowsNeeded; i++) {
    const startIdx = i * metricsPerRow;
    const endIdx = Math.min(startIdx + metricsPerRow, totalNewMetrics);
    const metricsInThisRow = newMetricIds.slice(startIdx, endIdx);

    // Calculate column sizes for this row - each metric gets equal width
    const columnSize = NUMBER_OF_COLUMNS / metricsInThisRow.length;
    const columnSizes = Array(metricsInThisRow.length).fill(columnSize);

    // Create the new row with an integer ID
    const newRow = {
      id: getNextRowId(newConfig.rows) + i,
      items: metricsInThisRow.map((id) => ({ id })),
      columnSizes,
      rowHeight: 320, // Default row height
    };

    newConfig.rows.push(newRow);
  }

  return newConfig;
};
