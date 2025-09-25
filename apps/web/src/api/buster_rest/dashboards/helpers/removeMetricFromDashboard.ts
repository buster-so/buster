import { NUMBER_OF_COLUMNS } from '@buster/server-shared/dashboards';
import type { BusterDashboard } from '@/api/asset_interfaces/dashboard';

export const removeMetricFromDashboardConfig = (
  metricIds: string[],
  existingConfig: BusterDashboard['config']
) => {
  // Create a new config object to avoid mutating the original
  const newConfig = {
    ...existingConfig,
    rows: [...(existingConfig.rows || [])],
  };

  // Filter out rows that contain metrics to be removed
  newConfig.rows = newConfig.rows
    .map((row) => {
      // Remove the specified metrics from the row
      const filteredItems = row.items.filter((item) => !metricIds.includes(item.id));

      // If no items left in the row, return null to filter out later
      if (filteredItems.length === 0) {
        return null;
      }

      // Recalculate column sizes for remaining items
      const columnSize = NUMBER_OF_COLUMNS / filteredItems.length;
      const columnSizes = Array(filteredItems.length).fill(columnSize);

      return {
        ...row,
        items: filteredItems,
        columnSizes,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  return newConfig;
};
