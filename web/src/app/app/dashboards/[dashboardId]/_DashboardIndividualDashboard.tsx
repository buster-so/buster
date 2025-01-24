import { BusterDashboardMetric, BusterDashboardResponse } from '@/api/buster_rest';
import React, { useEffect, useMemo, useRef } from 'react';
import isEmpty from 'lodash/isEmpty';
import { Button } from 'antd';
import { BusterResizeableGrid, BusterResizeableGridRow } from '@/components/grid';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import { hasRemovedThreads, hasUnmappedThreads, normalizeNewMetricsIntoGrid } from './_helpers';
import { DashboardMetricItem } from './_DashboardMetricItem';
import { DashboardConfig } from '@/api/buster_socket/dashboards/dashboardConfigInterfaces';
import { useDashboards } from '@/context/Dashboards';
import { AppMaterialIcons } from '@/components';
import { DashboardIndividualProvider, useDashboardIndividual } from './_DashboardInvididualContext';

const DEFAULT_EMPTY_ROWS: DashboardConfig['rows'] = [];
const DEFAULT_EMPTY_METRICS: BusterDashboardMetric[] = [];
const DEFAULT_EMPTY_CONFIG: DashboardConfig = {};

export const DashboardIndividualDashboard: React.FC<{
  allowEdit?: boolean;
  dashboardResponse: BusterDashboardResponse;
  onUpdateDashboardConfig: ReturnType<typeof useDashboards>['onUpdateDashboardConfig'];
  openAddContentModal: () => void;
}> = React.memo(
  ({ openAddContentModal, allowEdit, dashboardResponse, onUpdateDashboardConfig }) => {
    const metrics = dashboardResponse.metrics || DEFAULT_EMPTY_METRICS;
    const dashboardConfig = dashboardResponse.dashboard.config || DEFAULT_EMPTY_CONFIG;
    const configRows = dashboardConfig?.rows || DEFAULT_EMPTY_ROWS;
    const hasMetrics = !isEmpty(metrics);
    const [draggingId, setDraggingId] = React.useState<string | null>(null);

    const { run: debouncedForInitialRenderOnUpdateDashboardConfig } = useDebounceFn(
      onUpdateDashboardConfig,
      { wait: 650, leading: true }
    );

    const onRowLayoutChange = useMemoizedFn((rows: BusterResizeableGridRow[]) => {
      const formattedRows: DashboardConfig['rows'] = rows.map((row) => {
        return {
          ...row,
          items: row.items.map((item) => ({
            id: item.id
          }))
        };
      });
      onUpdateDashboardConfig({ rows: formattedRows }, dashboardResponse.dashboard.id);
    });

    const remapThreads = useMemo(() => {
      const res = hasUnmappedThreads(metrics, configRows) || hasRemovedThreads(metrics, configRows);
      return res;
    }, [metrics, configRows.length]);

    const rows = useMemo(() => {
      return remapThreads ? normalizeNewMetricsIntoGrid(metrics, configRows) : configRows;
    }, [remapThreads, metrics, configRows]);

    const dashboardRows = useMemo(() => {
      return rows
        .filter((row) => row.items.length > 0)
        .map((row) => {
          return {
            ...row,
            items: row.items.map((item) => {
              return {
                ...item,
                children: (
                  <DashboardMetricItem
                    key={item.id}
                    metricId={item.id}
                    dashboardId={dashboardResponse.dashboard.id}
                    allowEdit={allowEdit}
                    numberOfMetrics={dashboardResponse.metrics.length}
                  />
                )
              };
            })
          };
        });
    }, [rows]);

    const onDragEnd = useMemoizedFn(() => {
      setDraggingId(null);
    });

    const onStartDrag = useMemoizedFn(({ id }: { id: string }) => {
      setDraggingId(id);
    });

    useEffect(() => {
      if (remapThreads && dashboardResponse.dashboard.id) {
        debouncedForInitialRenderOnUpdateDashboardConfig({
          rows: rows
        });
      }
    }, [dashboardResponse.dashboard.id, remapThreads]);

    return (
      <div className="h-full w-full">
        {hasMetrics && !!dashboardRows.length ? (
          <DashboardIndividualProvider>
            <BusterResizeableGrid
              rows={dashboardRows}
              allowEdit={allowEdit}
              onRowLayoutChange={onRowLayoutChange}
              onStartDrag={onStartDrag}
              onEndDrag={onDragEnd}
              overlayComponent={
                draggingId && (
                  <DashboardMetricItem
                    metricId={draggingId}
                    allowEdit={false}
                    dashboardId={dashboardResponse.dashboard.id}
                    isDragOverlay
                    numberOfMetrics={dashboardResponse.metrics.length}
                  />
                )
              }
            />
          </DashboardIndividualProvider>
        ) : (
          <DashboardEmptyState openAddContentModal={openAddContentModal} />
        )}
      </div>
    );
  }
);
DashboardIndividualDashboard.displayName = 'DashboardIndividualDashboard';

const DashboardEmptyState: React.FC<{
  openAddContentModal: () => void;
}> = React.memo(({ openAddContentModal }) => {
  return (
    <div className="-ml-1.5">
      <Button type="text" icon={<AppMaterialIcons icon="add" />} onClick={openAddContentModal}>
        Add content
      </Button>
    </div>
  );
});
DashboardEmptyState.displayName = 'DashboardEmptyState';
