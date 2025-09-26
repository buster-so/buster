import { MAX_NUMBER_OF_ITEMS_ON_DASHBOARD } from '@buster/server-shared/dashboards';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from 'mutative';
import type { BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { createDashboardFullConfirmModal } from '@/components/features/modals/createDashboardFullConfirmModal';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useEnsureDashboardConfig } from '../dashboardQueryHelpers';
import { addMetricToDashboardConfig, removeMetricFromDashboardConfig } from '../helpers';
import { addAndRemoveMetricsToDashboard } from '../helpers/addAndRemoveMetricsToDashboard';
import { useSaveDashboard } from '../queryRequests';

/**
 * useAddAndRemoveMetricsFromDashboard
 */
export const useAddAndRemoveMetricsFromDashboard = () => {
  const { openErrorMessage, openConfirmModal } = useBusterNotifications();
  const ensureDashboardConfig = useEnsureDashboardConfig({ prefetchData: false });
  const { mutateAsync: dashboardsUpdateDashboard } = useSaveDashboard({
    updateOnSave: true,
    updateVersion: true,
  });

  const addAndRemoveMetrics = async ({
    metrics,
    dashboardId,
  }: {
    metrics: { id: string; name: string }[];
    dashboardId: string;
  }) => {
    const dashboardResponse = await ensureDashboardConfig(dashboardId);

    if (dashboardResponse) {
      const existingMetricIds = new Set(
        dashboardResponse.dashboard.config.rows?.flatMap((row) =>
          row.items.map((item) => item.id)
        ) || []
      );

      const metricsToAdd = metrics.filter((metric) => !existingMetricIds.has(metric.id));
      const metricsToRemove = Array.from(existingMetricIds).filter(
        (id) => !metrics.some((metric) => metric.id === id)
      );

      const currentMetricCount = existingMetricIds.size - metricsToRemove.length;
      const availableSlots = MAX_NUMBER_OF_ITEMS_ON_DASHBOARD - currentMetricCount;
      const metricsToActuallyAdd = metricsToAdd.slice(0, availableSlots);

      const addMethod = async () => {
        const finalMetricIds = [
          ...Array.from(existingMetricIds).filter((id) => !metricsToRemove.includes(id)),
          ...metricsToActuallyAdd.map((metric) => metric.id),
        ];

        const newConfig = addAndRemoveMetricsToDashboard(
          finalMetricIds,
          dashboardResponse.dashboard.config
        );

        const data = await dashboardsUpdateDashboard({
          id: dashboardId,
          config: newConfig,
          update_version: true,
        });

        return data;
      };

      if (metricsToAdd.length > availableSlots) {
        if (availableSlots === 0) {
          return openConfirmModal({
            title: 'Dashboard is full',
            content: `The dashboard is full, please remove some metrics before adding more. You can only have ${MAX_NUMBER_OF_ITEMS_ON_DASHBOARD} metrics on a dashboard at a time.`,
            primaryButtonProps: { text: 'Okay' },
            cancelButtonProps: { hide: true },
            onOk: () => {},
          });
        }

        const content = createDashboardFullConfirmModal({
          availableSlots,
          metricsToActuallyAdd: metricsToActuallyAdd,
          metricsToAdd: metricsToAdd,
        });

        return openConfirmModal<BusterDashboardResponse>({
          title: 'Dashboard is full',
          content,
          primaryButtonProps: { text: 'Okay' },
          onOk: async () => {
            return await addMethod();
          },
        });
      }

      return await addMethod();
    }

    openErrorMessage('Failed to save metrics to dashboard');
    return;
  };

  return useMutation({
    mutationFn: addAndRemoveMetrics,
  });
};

/**
 * useAddMetricsToDashboard
 */
export const useAddMetricsToDashboard = () => {
  const queryClient = useQueryClient();
  const { openErrorMessage, openConfirmModal } = useBusterNotifications();
  const ensureDashboardConfig = useEnsureDashboardConfig({ prefetchData: false });
  const { mutateAsync: dashboardsUpdateDashboard } = useSaveDashboard({
    updateOnSave: true,
    updateVersion: true,
  });

  const addMetricToDashboard = async ({
    metricIds,
    dashboardId,
  }: {
    metricIds: string[];
    dashboardId: string;
  }) => {
    const dashboardResponse = await ensureDashboardConfig(dashboardId, true, undefined);

    const existingMetricIds = new Set(
      dashboardResponse?.dashboard.config.rows?.flatMap((row) =>
        row.items.map((item) => item.id)
      ) || []
    );

    const metricsToAdd = metricIds.filter((id) => !existingMetricIds.has(id));
    const currentMetricCount = existingMetricIds.size;
    const availableSlots = MAX_NUMBER_OF_ITEMS_ON_DASHBOARD - currentMetricCount;

    if (metricsToAdd.length > availableSlots) {
      return openConfirmModal({
        title: 'Dashboard is full',
        content: `The dashboard is full, please remove some metrics before adding more. You can only have ${MAX_NUMBER_OF_ITEMS_ON_DASHBOARD} metrics on a dashboard at a time.`,
        primaryButtonProps: { text: 'Okay' },
        onOk: () => {},
      });
    }

    if (dashboardResponse) {
      const newConfig = addMetricToDashboardConfig(metricIds, dashboardResponse.dashboard.config);
      return dashboardsUpdateDashboard({ id: dashboardId, config: newConfig });
    }

    openErrorMessage('Failed to save metrics to dashboard');
  };

  return useMutation({
    mutationFn: addMetricToDashboard,
    onMutate: ({ metricIds, dashboardId }) => {
      for (const metricId of metricIds) {
        const options = metricsQueryKeys.metricsGetMetric(metricId, 'LATEST');
        queryClient.setQueryData(options.queryKey, (old) => {
          if (!old) return old;
          return create(old, (draft) => {
            draft.dashboards = [...(draft.dashboards || []), { id: dashboardId, name: '' }];
          });
        });
      }
    },
  });
};

/**
 * useRemoveMetricsFromDashboard
 */
export const useRemoveMetricsFromDashboard = () => {
  const { openConfirmModal, openErrorMessage } = useBusterNotifications();
  const queryClient = useQueryClient();
  const ensureDashboardConfig = useEnsureDashboardConfig({ prefetchData: false });
  const { mutateAsync: dashboardsUpdateDashboard } = useSaveDashboard({
    updateOnSave: true,
    updateVersion: true,
  });

  const removeMetricFromDashboard = async ({
    metricIds,
    dashboardId,
    useConfirmModal = true,
  }: {
    metricIds: string[];
    dashboardId: string;
    useConfirmModal?: boolean;
  }) => {
    const method = async () => {
      for (const metricId of metricIds) {
        const options = metricsQueryKeys.metricsGetMetric(metricId, 'LATEST');
        queryClient.setQueryData(options.queryKey, (old) => {
          if (!old) return old;
          return create(old, (draft) => {
            draft.dashboards = old?.dashboards?.filter((d) => d.id !== dashboardId) || [];
          });
        });
      }

      const dashboardResponse = await ensureDashboardConfig(dashboardId, false, undefined);

      if (dashboardResponse) {
        const newConfig = removeMetricFromDashboardConfig(
          metricIds,
          dashboardResponse.dashboard.config
        );

        const data = await dashboardsUpdateDashboard({ id: dashboardId, config: newConfig });

        if (!data) {
          console.warn('Failed to remove metrics from dashboard');
          return;
        }

        return data;
      }

      openErrorMessage('Failed to remove metrics from dashboard');
    };

    if (!useConfirmModal) return await method();

    return await openConfirmModal({
      title: 'Remove from dashboard',
      content:
        metricIds.length > 1
          ? 'Are you sure you want to remove these metrics from the dashboard?'
          : 'Are you sure you want to remove this metric from the dashboard?',
      onOk: method,
    });
  };

  return useMutation({
    mutationFn: removeMetricFromDashboard,
  });
};
