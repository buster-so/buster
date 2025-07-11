'use client';

import isEmpty from 'lodash/isEmpty';
import React, { useEffect, useMemo, useState } from 'react';
import type {
  BusterDashboardResponse,
  BusterMetric,
  DashboardConfig
} from '@/api/asset_interfaces';
import type { useUpdateDashboardConfig } from '@/api/buster_rest/dashboards';
import { BusterResizeableGrid, type BusterResizeableGridRow } from '@/components/ui/grid';
import { useDebounceFn, useMemoizedFn } from '@/hooks';
import { DashboardContentControllerProvider } from './DashboardContentControllerContext';
import { DashboardEmptyState, DashboardNoContentReadOnly } from './DashboardEmptyState';
import { DashboardMetricItem } from './DashboardMetricItem';
import {
  hasRemovedMetrics,
  hasUnmappedMetrics,
  normalizeNewMetricsIntoGrid,
  removeChildrenFromItems
} from './helpers';

const DEFAULT_EMPTY_ROWS: DashboardConfig['rows'] = [];
const DEFAULT_EMPTY_METRICS: Record<string, BusterMetric> = {};
const DEFAULT_EMPTY_CONFIG: DashboardConfig = {};

export const DashboardContentController: React.FC<{
  readOnly?: boolean;
  metrics: BusterDashboardResponse['metrics'] | undefined;
  chatId: string | undefined;
  dashboard: BusterDashboardResponse['dashboard'] | undefined;
  onUpdateDashboardConfig: ReturnType<typeof useUpdateDashboardConfig>['mutateAsync'];
  onOpenAddContentModal: () => void;
}> = React.memo(
  ({
    onOpenAddContentModal,
    dashboard,
    chatId,
    readOnly = false,
    metrics = DEFAULT_EMPTY_METRICS,
    onUpdateDashboardConfig
  }) => {
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const dashboardVersionNumber = dashboard?.version_number;
    const dashboardConfig = dashboard?.config || DEFAULT_EMPTY_CONFIG;
    const configRows = dashboardConfig?.rows || DEFAULT_EMPTY_ROWS;
    const hasMetrics = !isEmpty(metrics);
    const numberOfMetrics = Object.values(metrics).length;

    const remapMetrics = useMemo(() => {
      return hasUnmappedMetrics(metrics, configRows) || hasRemovedMetrics(metrics, configRows);
    }, [metrics, configRows.length]);

    const rows = useMemo(() => {
      return remapMetrics ? normalizeNewMetricsIntoGrid(metrics, configRows) : configRows;
    }, [remapMetrics, metrics, configRows]);

    const memoizedOverlayComponent = useMemo(() => {
      return (
        dashboard &&
        draggingId && (
          <DashboardMetricItem
            metricId={draggingId}
            readOnly={true}
            dashboardId={dashboard?.id}
            isDragOverlay
            numberOfMetrics={numberOfMetrics}
            chatId={undefined}
            dashboardVersionNumber={dashboardVersionNumber}
            metricVersionNumber={metrics[draggingId]?.version_number}
          />
        )
      );
    }, [draggingId, dashboard?.id, numberOfMetrics, metrics]);

    const dashboardRows = useMemo(() => {
      return rows
        .filter((row) => row.items.length > 0)
        .map((row) => {
          return {
            ...row,
            items: row.items.map((item) => {
              const selectedMetric = metrics[item.id];
              const metricVersionNumber = selectedMetric.version_number;

              return {
                ...item,
                children: (
                  <DashboardMetricItem
                    key={item.id}
                    metricId={item.id}
                    dashboardId={dashboard?.id || ''}
                    readOnly={readOnly}
                    chatId={chatId}
                    numberOfMetrics={numberOfMetrics}
                    metricVersionNumber={metricVersionNumber}
                    dashboardVersionNumber={dashboardVersionNumber}
                  />
                )
              };
            })
          };
        });
    }, [JSON.stringify(rows), readOnly, dashboard?.id, numberOfMetrics]);

    const { run: debouncedForInitialRenderOnUpdateDashboardConfig } = useDebounceFn(
      onUpdateDashboardConfig,
      { wait: 650, leading: true }
    );

    const onRowLayoutChange = useMemoizedFn((layoutRows: BusterResizeableGridRow[]) => {
      if (dashboard) {
        onUpdateDashboardConfig({
          rows: removeChildrenFromItems(layoutRows),
          dashboardId: dashboard.id
        });
      }
    });

    const onDragEnd = useMemoizedFn(() => {
      setDraggingId(null);
    });

    const onStartDrag = useMemoizedFn(({ id }: { id: string }) => {
      setDraggingId(id);
    });

    useEffect(() => {
      if (remapMetrics && dashboard?.id) {
        debouncedForInitialRenderOnUpdateDashboardConfig({ rows, dashboardId: dashboard.id });
      }
    }, [dashboard?.id, remapMetrics]);

    //overflow visible is needed to allow dropzones to be visible
    return (
      <div className="dashboard-content-controller overflow-visible">
        {hasMetrics && !!dashboardRows.length && !!dashboard ? (
          <DashboardContentControllerProvider dashboard={dashboard}>
            <BusterResizeableGrid
              rows={dashboardRows}
              readOnly={readOnly}
              onRowLayoutChange={onRowLayoutChange}
              onStartDrag={onStartDrag}
              onEndDrag={onDragEnd}
              overlayComponent={memoizedOverlayComponent}
            />
          </DashboardContentControllerProvider>
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
