import type { DashboardConfig } from '@buster/server-shared/dashboards';

/**
 * Get the next available row ID for a dashboard by finding the max existing ID and adding 1
 * @param rows - The existing dashboard rows
 * @returns The next available row ID (positive integer)
 */
export function getNextRowId(rows: DashboardConfig['rows']): number {
  const existingIds = rows?.map((row) => row.id) || [];
  const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
  return maxId + 1;
}
