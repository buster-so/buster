import type { DashboardConfig } from '@buster/server-shared/dashboards';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { getNextRowId } from '@/api/buster_rest/dashboards/helpers';
import {
  MAX_NUMBER_OF_ITEMS,
  MIN_ROW_HEIGHT,
  NUMBER_OF_COLUMNS,
} from '@/components/ui/grid/helpers';

export const normalizeNewMetricsIntoGrid = (
  metricsRecord: Record<string, BusterMetric>,
  grid: DashboardConfig['rows'] = []
): NonNullable<DashboardConfig['rows']> => {
  const metrics = Object.values(metricsRecord);
  const newMetrics = getAddedMetrics(metrics, grid);
  const removedMetrics = getRemovedMetrics(metrics, grid);
  const numberOfNewMetrics = newMetrics.length;
  const numberOfRemovedMetrics = removedMetrics.length;
  const numberOfRows = grid.length;
  let newGrid = grid;

  const createNewOverflowRows = (metrics: BusterMetric[]) => {
    return metrics.reduce<NonNullable<DashboardConfig['rows']>>((acc, metric, index) => {
      const rowIndex = Math.floor(index / 4);
      const selectedRow = acc[rowIndex];
      if (!selectedRow) {
        acc[rowIndex] = {
          id: getNextRowId([...grid, ...acc]),
          columnSizes: [NUMBER_OF_COLUMNS],
          rowHeight: MIN_ROW_HEIGHT,
          items: [{ id: metric.id }],
        };
      } else {
        selectedRow.items.push({ id: metric.id });
        selectedRow.columnSizes = Array.from({ length: selectedRow.items.length }, () => {
          return NUMBER_OF_COLUMNS / selectedRow.items.length;
        });
      }

      return acc;
    }, []);
  };

  // First, remove any metrics that are no longer in the metricsRecord
  if (numberOfRemovedMetrics > 0) {
    newGrid = grid
      .map((row) => {
        const newItems = row.items.filter((item) => metrics.some((m) => m.id === item.id));
        if (newItems.length === 0) return null;

        const columnSizes = Array.from({ length: newItems.length }, () => {
          return NUMBER_OF_COLUMNS / newItems.length;
        });
        return {
          ...row,
          items: newItems,
          columnSizes,
        };
      })
      .filter((row) => row !== null);
  }

  // Then, add new metrics
  if (numberOfNewMetrics > 0) {
    if (numberOfRows === 0 || newGrid.length === 0) {
      newGrid = createNewOverflowRows(newMetrics);
    } else {
      const numberOfItemsInFirstRow = newGrid[0].items?.length || 0;
      const canFitInFirstRow = numberOfItemsInFirstRow + numberOfNewMetrics <= MAX_NUMBER_OF_ITEMS;
      if (canFitInFirstRow) {
        const newItems = newMetrics.map((m) => ({
          id: m.id,
        }));
        const newNumberOfItemsInFirstRow = numberOfItemsInFirstRow + numberOfNewMetrics;
        const columnSizes = Array.from({ length: newNumberOfItemsInFirstRow }, () => {
          return NUMBER_OF_COLUMNS / newNumberOfItemsInFirstRow;
        });

        newGrid = [
          {
            ...newGrid[0],
            items: [...newGrid[0].items, ...newItems],
            columnSizes,
          },
          ...newGrid.slice(1),
        ];
      } else {
        const newRows = createNewOverflowRows(newMetrics);
        newGrid = [...newRows, ...newGrid];
      }
    }
  }

  return newGrid.filter((row) => row.items.length > 0);
};

const getRemovedMetrics = (metrics: BusterMetric[], configRows: DashboardConfig['rows'] = []) => {
  const allGridItems = configRows.flatMap((r) => r.items);
  return allGridItems.filter((t) => !metrics.some((m) => m.id === t.id));
};

const getAddedMetrics = (metrics: BusterMetric[], configRows: DashboardConfig['rows'] = []) => {
  return metrics.filter((m) => !configRows.some((r) => r.items.some((t) => t.id === m.id)));
};
