import type { DashboardConfig } from '@/api/asset_interfaces/dashboard';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import type { BusterResizeableGridRow } from '@/components/ui/grid';
import omit from 'lodash/omit';

export const hasUnmappedMetrics = (
  metrics: Record<string, BusterMetric>,
  configRows: DashboardConfig['rows'] = []
) => {
  return !Object.values(metrics).every((m) =>
    configRows.some((r) => r.items.some((t) => t.id === m.id))
  );
};

export const hasRemovedMetrics = (
  metrics: Record<string, BusterMetric>,
  configRows: DashboardConfig['rows'] = []
) => {
  const allGridItemsLength = configRows.flatMap((r) => r.items).length;

  if (allGridItemsLength !== Object.values(metrics).length) {
    return true;
  }

  return !configRows.every((r) =>
    r.items.some((t) => Object.values(metrics).some((m) => t.id === m.id))
  );
};

export const removeChildrenFromItems = (row: BusterResizeableGridRow[]) => {
  return row.map((r) => ({
    ...r,
    items: r.items.map((i) => omit(i, 'children'))
  }));
};
