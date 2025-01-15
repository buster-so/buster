import { DashboardConfig } from '@/api/buster-socket/dashboards/dashboardConfigInterfaces';
import { BusterDashboardMetric } from '@/api/buster-rest';
import { BusterResizeableGridRow } from '@/components/grid';
import {
  NUMBER_OF_COLUMNS,
  MAX_NUMBER_OF_COLUMNS,
  MAX_NUMBER_OF_ITEMS,
  MIN_ROW_HEIGHT
} from '@/components/grid/config';
import { v4 as uuidv4 } from 'uuid';

export const normalizeNewMetricsIntoGrid = (
  metrics: BusterDashboardMetric[],
  grid: DashboardConfig['rows'] = []
): BusterResizeableGridRow[] => {
  const newMetrics = getAddedThreads(metrics, grid);
  const removedMetrics = getRemovedThreads(metrics, grid);
  const numberOfNewMetrics = newMetrics.length;
  const numberOfRemovedMetrics = removedMetrics.length;
  const numberOfRows = grid.length;
  let newGrid = grid;

  const createNewOverflowRows = (metrics: BusterDashboardMetric[]) => {
    return metrics.reduce<BusterResizeableGridRow[]>((acc, metric, index) => {
      const rowIndex = Math.floor(index / 4);
      const selectedRow = acc[rowIndex];
      if (!selectedRow) {
        acc[rowIndex] = {
          id: uuidv4(),
          columnSizes: [NUMBER_OF_COLUMNS],
          rowHeight: MIN_ROW_HEIGHT,
          items: [{ id: metric.id }]
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

  if (numberOfRemovedMetrics > 0) {
    newGrid = grid.map((row) => {
      const rowHasRemoved = row.items.some((item) => removedMetrics.some((m) => m.id === item.id));
      if (!rowHasRemoved) {
        return row;
      }

      const newItems = row.items.filter((item) => !removedMetrics.some((m) => m.id === item.id));
      const columnSizes = Array.from({ length: newItems.length }, () => {
        return NUMBER_OF_COLUMNS / newItems.length;
      });
      return {
        ...row,
        items: newItems,
        columnSizes: columnSizes
      };
    });
  }

  if (numberOfNewMetrics > 0) {
    if (numberOfRows === 0) {
      newGrid = createNewOverflowRows(newMetrics);
    } else {
      const numberOfItemsInFirstRow = grid[0].items?.length!;
      const canFitInFirstRow = numberOfItemsInFirstRow + numberOfNewMetrics <= MAX_NUMBER_OF_ITEMS;
      if (canFitInFirstRow) {
        const newItems = newMetrics.map((m) => ({
          id: m.id
        }));
        const newNumberOfItemsInFirstRow = numberOfItemsInFirstRow + numberOfNewMetrics;
        const columnSizes = Array.from({ length: newNumberOfItemsInFirstRow }, () => {
          return NUMBER_OF_COLUMNS / newNumberOfItemsInFirstRow;
        });

        newGrid = [
          {
            ...grid[0],
            items: [...newItems, ...grid[0].items],
            columnSizes: columnSizes
          },
          ...grid.slice(1)
        ];
      } else {
        const newRows = newMetrics.reduce((acc, metric, index) => {
          const rowIndex = Math.floor(index / 4);
          const selectedRow = acc[rowIndex];
          if (!selectedRow) {
            acc[rowIndex] = {
              id: uuidv4(),
              columnSizes: [NUMBER_OF_COLUMNS],
              rowHeight: MIN_ROW_HEIGHT,
              items: [{ id: metric.id }]
            };
          } else {
            selectedRow.items.push({ id: metric.id });
            selectedRow.columnSizes = Array.from({ length: selectedRow.items.length }, () => {
              return NUMBER_OF_COLUMNS / selectedRow.items.length;
            });
          }

          return acc;
        }, [] as BusterResizeableGridRow[]);

        newGrid = [...newRows, ...grid];
      }
    }
  }

  return newGrid.filter((row) => row.items.length > 0);
};

export const hasUnmappedThreads = (
  metrics: BusterDashboardMetric[],
  configRows: DashboardConfig['rows'] = []
) => {
  return !metrics.every((m) => configRows.some((r) => r.items.some((t) => t.id === m.id)));
};

export const hasRemovedThreads = (
  metrics: BusterDashboardMetric[],
  configRows: BusterResizeableGridRow[]
) => {
  const allGridItemsLength = configRows.flatMap((r) => r.items).length;

  if (allGridItemsLength !== metrics.length) {
    return true;
  }

  return !configRows.every((r) => r.items.some((t) => metrics.some((m) => t.id === m.id)));
};

const getRemovedThreads = (
  metrics: BusterDashboardMetric[],
  configRows: DashboardConfig['rows'] = []
) => {
  const allGridItems = configRows.flatMap((r) => r.items);
  return allGridItems.filter((t) => !metrics.some((m) => m.id === t.id));
};

const getAddedThreads = (
  metrics: BusterDashboardMetric[],
  configRows: DashboardConfig['rows'] = []
) => {
  return metrics.filter((m) => !configRows.some((r) => r.items.some((t) => t.id === m.id)));
};
