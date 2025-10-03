import type { DashboardConfig } from '@buster/server-shared/dashboards';
import isEmpty from 'lodash/isEmpty';
import React, { useMemo, useState } from 'react';
import type { BusterDashboardResponse, BusterMetric } from '@/api/asset_interfaces';
import type { useUpdateDashboardConfig } from '@/api/buster_rest/dashboards';
import { DashboardFilters } from '@/components/features/dashboards/DashboardFilters';
import { BusterResizeableGrid, type BusterResizeableGridRow } from '@/components/ui/grid';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { DashboardMetricItem } from '../../../../components/features/metrics/DashboardMetricItem';
import { DashboardContentControllerProvider } from './DashboardContentControllerContext';
import { DashboardEmptyState, DashboardNoContentReadOnly } from './DashboardEmptyState';
import { DashboardFilterProvider } from './DashboardFilterContext';
import { getCommonFilters } from './helpers/getCommonFilters';
import { removeChildrenFromItems } from './helpers';

const DEFAULT_EMPTY_ROWS: DashboardConfig['rows'] = [];
const DEFAULT_EMPTY_METRICS: Record<string, BusterMetric> = {};
const DEFAULT_EMPTY_CONFIG: DashboardConfig = {};

export const DashboardContentController: React.FC<{
  readOnly?: boolean;
  metrics: BusterDashboardResponse['metrics'] | undefined;
  dashboard: BusterDashboardResponse['dashboard'] | undefined;
  onUpdateDashboardConfig: ReturnType<typeof useUpdateDashboardConfig>['mutateAsync'];
  onOpenAddContentModal: () => void;
  animate?: boolean;
}> = React.memo(
  ({
    onOpenAddContentModal,
    dashboard,
    readOnly = false,
    animate = true,
    metrics = DEFAULT_EMPTY_METRICS,
    onUpdateDashboardConfig,
  }) => {
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dashboardFilterValues, setDashboardFilterValues] = useState<Record<string, unknown>>({});

    const commonFilters = useMemo(() => {
      const filters = getCommonFilters(metrics);
      console.log('DashboardContentController - commonFilters:', filters);
      console.log('DashboardContentController - readOnly:', readOnly);
      console.log('DashboardContentController - Should show filters?', !readOnly && filters.length > 0);
      return filters;
    }, [metrics, readOnly]);

    const dashboardVersionNumber = dashboard?.version_number;
    const dashboardConfig = dashboard?.config || DEFAULT_EMPTY_CONFIG;
    const rows = dashboardConfig?.rows || DEFAULT_EMPTY_ROWS;
    const hasMetrics = !isEmpty(metrics);
    const numberOfMetrics = Object.values(metrics).length;

    const memoizedOverlayComponent = useMemo(() => {
      return (
        dashboard &&
        draggingId && (
          <DashboardMetricItem
            metricId={draggingId}
            dashboardId={dashboard?.id}
            isDragOverlay
            numberOfMetrics={numberOfMetrics}
            dashboardVersionNumber={dashboardVersionNumber}
            metricVersionNumber={metrics[draggingId]?.version_number}
            readOnly={readOnly}
          />
        )
      );
    }, [draggingId, dashboard?.id, numberOfMetrics, metrics, readOnly]);

    const dashboardRows: BusterResizeableGridRow[] = useMemo(() => {
      return rows
        .filter((row) => row.items.length > 0)
        .map((row) => {
          return {
            ...row,
            id: String(row.id),
            items: row.items.map((item) => {
              const selectedMetric = metrics[item.id];
              const metricVersionNumber = selectedMetric.version_number;

              return {
                ...item,
                children: (
                  //todo move this a callback...
                  <DashboardMetricItem
                    key={item.id}
                    metricId={item.id}
                    dashboardId={dashboard?.id || ''}
                    numberOfMetrics={numberOfMetrics}
                    metricVersionNumber={metricVersionNumber}
                    dashboardVersionNumber={dashboardVersionNumber}
                    animate={animate}
                    readOnly={readOnly}
                  />
                ),
              };
            }),
          };
        });
    }, [JSON.stringify(rows), readOnly, dashboard?.id, numberOfMetrics, animate]);

    const onRowLayoutChange = useMemoizedFn((layoutRows: BusterResizeableGridRow[]) => {
      if (dashboard) {
        onUpdateDashboardConfig({
          rows: removeChildrenFromItems(layoutRows),
          dashboardId: dashboard.id,
        });
      }
    });

    const onDragEnd = useMemoizedFn(() => {
      setDraggingId(null);
    });

    const onStartDrag = useMemoizedFn(({ id }: { id: string }) => {
      setDraggingId(id);
    });

    //overflow visible is needed to allow dropzones to be visible
    return (
      <div className="dashboard-content-controller overflow-visible">
        {hasMetrics && !!dashboardRows.length && !!dashboard ? (
          <DashboardFilterProvider>
            <DashboardContentControllerProvider dashboard={dashboard}>
              {!readOnly && commonFilters.length > 0 && (
                <DashboardFilters
                  commonFilters={commonFilters}
                  onFilterValuesChange={setDashboardFilterValues}
                />
              )}
              <BusterResizeableGrid
                rows={dashboardRows}
                readOnly={readOnly}
                onRowLayoutChange={onRowLayoutChange}
                onStartDrag={onStartDrag}
                onEndDrag={onDragEnd}
                overlayComponent={memoizedOverlayComponent}
              />
            </DashboardContentControllerProvider>
          </DashboardFilterProvider>
        ) : !readOnly ? (
          <DashboardEmptyState onOpenAddContentModal={onOpenAddContentModal} />
        ) : (
          <DashboardNoContentReadOnly />
        )}
      </div>
    );
  }
);
DashboardContentController.displayName = 'DashboardIndividualDashboard';
