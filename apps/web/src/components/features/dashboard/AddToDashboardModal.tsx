import type React from 'react';
import { useMemo } from 'react';
import { useAddAndRemoveMetricsFromDashboard, useGetDashboard } from '@/api/buster_rest/dashboards';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { AddMetricModal } from './AddMetricModal';

export const AddToDashboardModal: React.FC<{
  open: boolean;
  onClose: () => void;
  dashboardId: string;
  dashboardVersionNumber: number | undefined;
}> = ({ open, onClose, dashboardId, dashboardVersionNumber }) => {
  const { data: dashboard, isFetched: isFetchedDashboard } = useGetDashboard({
    id: dashboardId,
    versionNumber: dashboardVersionNumber,
  });
  const { mutateAsync: addAndRemoveMetricsFromDashboard } = useAddAndRemoveMetricsFromDashboard();

  const initialSelectedMetrics = useMemo(
    () =>
      Object.values(dashboard?.metrics || {}).map((metric) => ({
        id: metric.id,
        name: metric.name,
      })),
    [dashboard?.metrics]
  );

  const handleAddAndRemoveMetrics = useMemoizedFn(
    async (selectedMetrics: { id: string; name: string }[]) => {
      await addAndRemoveMetricsFromDashboard({
        dashboardId: dashboardId,
        metrics: selectedMetrics,
      });
      onClose();
    }
  );

  return (
    <AddMetricModal
      open={open}
      initialSelectedMetrics={initialSelectedMetrics}
      loading={!isFetchedDashboard}
      onAddMetrics={handleAddAndRemoveMetrics}
      onClose={onClose}
      saveButtonText="Update dashboard"
    />
  );
};

AddToDashboardModal.displayName = 'AddToDashboardModal';
