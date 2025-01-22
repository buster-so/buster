import {
  IBusterDashboardMetric,
  BusterMetricDataResponse,
  BusterDashboardMetric
} from '@/api/buster_rest';
import { BusterRoutes } from '@/routes';
import { useMemoizedFn } from 'ahooks';
import React, { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useAppLayoutContextSelector } from '../BusterAppLayout';
import { useBusterWebSocket } from '../BusterWebSocket';
import { upgradeDashboardMetric } from './dashboardContextHelper';
import { useBusterMessageDataContextSelector } from '../MessageData';

export const useDashboardMetrics = ({ openedDashboardId }: { openedDashboardId: string }) => {
  const busterSocket = useBusterWebSocket();
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const onSetLoadingMessageData = useBusterMessageDataContextSelector(
    (s) => s.onSetLoadingMessageData
  );
  const onSetMessageData = useBusterMessageDataContextSelector((s) => s.onSetMessageData);

  const metrics = useRef<Record<string, IBusterDashboardMetric>>({});
  const [isPending, startTransition] = useTransition();

  const setMetrics = useMemoizedFn((newMetrics: Record<string, IBusterDashboardMetric>) => {
    metrics.current = { ...metrics.current, ...newMetrics };
    startTransition(() => {
      //this is just used to trigger a re-render
    });
  });

  const getMetric = useCallback(
    (metricId: string) => {
      return metrics.current[metricId];
    },
    [isPending]
  );

  const _updateMetricData = useMemoizedFn((metricRes: BusterMetricDataResponse) => {
    onSetMessageData({
      messageId: metricRes.metric_id,
      data: metricRes.data,
      code: metricRes.code
    });
  });

  const resetDashboardMetric = useMemoizedFn(({ threadId }: { threadId: string }) => {
    delete metrics.current[threadId];
    setMetrics(metrics.current);
  });

  const onOpenMetric = useMemoizedFn((metricId: string) => {
    onChangePage({
      route: BusterRoutes.APP_DASHBOARD_THREADS_ID,
      threadId: metricId,
      dashboardId: openedDashboardId
    });
  });

  const onRemoveFromCollection = useMemoizedFn(
    async ({
      dashboardId,
      collectionId
    }: {
      collectionId: string | string[];
      dashboardId?: string;
    }) => {
      const id = dashboardId || openedDashboardId;
      busterSocket.emit({
        route: '/dashboards/update',
        payload: {
          remove_from_collections: typeof collectionId === 'string' ? [collectionId] : collectionId,
          id
        }
      });
    }
  );

  const onUpdateDashboardMetrics = useMemoizedFn((dashboardMetrics: BusterDashboardMetric[]) => {
    const metricsRecord = dashboardMetrics.reduce<Record<string, IBusterDashboardMetric>>(
      (acc, metric) => {
        acc[metric.id] = upgradeDashboardMetric(metric, metrics.current[metric.id]);
        return acc;
      },
      {}
    );
    setMetrics(metricsRecord);
    dashboardMetrics.forEach((metric) => {
      onSetLoadingMessageData({
        messageId: metric.id,
        data_metadata: metric.data_metadata,
        code: metric.code
      });
    });
  });

  useEffect(() => {
    if (openedDashboardId) {
      busterSocket.on({
        route: '/dashboards/get:fetchingData',
        callback: _updateMetricData
      });
    }
    return () => {
      busterSocket.off({
        route: '/dashboards/get:fetchingData',
        callback: _updateMetricData
      });
    };
  }, [openedDashboardId]);

  return {
    getMetric,
    onOpenMetric,
    onRemoveFromCollection,
    resetDashboardMetric,
    onUpdateDashboardMetrics
  };
};
