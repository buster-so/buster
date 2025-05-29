import {
  useAddMetricsToDashboard,
  useRemoveMetricsFromDashboard
} from '@/api/buster_rest/dashboards';
import { Button } from '@/components/ui/buttons';
import { AppTooltip } from '@/components/ui/tooltip';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import React, { useState } from 'react';
import { ASSET_ICONS } from '../config/assetIcons';
import { SaveToDashboardDropdown } from '../dropdowns/SaveToDashboardDropdown';

export const SaveMetricToDashboardButton: React.FC<{
  metricIds: string[];
  disabled?: boolean;
  selectedDashboards: string[];
}> = React.memo(({ metricIds, disabled = false, selectedDashboards: selectedDashboardsProp }) => {
  const { mutateAsync: saveMetricsToDashboard } = useAddMetricsToDashboard();
  const { mutateAsync: removeMetricsFromDashboard } = useRemoveMetricsFromDashboard();
  const { openConfirmModal } = useBusterNotifications();

  const [selectedDashboards, setSelectedDashboards] =
    useState<Parameters<typeof SaveToDashboardDropdown>[0]['selectedDashboards']>(
      selectedDashboardsProp
    );

  const onSaveToDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
    setSelectedDashboards((prev) => [...prev, ...dashboardIds]);
    await Promise.all(
      dashboardIds.map((dashboardId) => saveMetricsToDashboard({ metricIds, dashboardId }))
    );
  });

  const onRemoveFromDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
    const method = async () => {
      setSelectedDashboards((prev) => prev.filter((x) => !dashboardIds.includes(x)));
      await Promise.all(
        dashboardIds.map((dashboardId) =>
          removeMetricsFromDashboard({ useConfirmModal: false, metricIds, dashboardId })
        )
      );
    };
    return await openConfirmModal({
      title: 'Remove from dashboard',
      content: 'Are you sure you want to remove this from the dashboard?',
      onOk: method
    });
  });

  return (
    <SaveToDashboardDropdown
      selectedDashboards={selectedDashboards}
      onSaveToDashboard={onSaveToDashboard}
      onRemoveFromDashboard={onRemoveFromDashboard}>
      <AppTooltip title={'Save to dashboard'}>
        <Button
          variant="ghost"
          disabled={disabled}
          prefix={<ASSET_ICONS.dashboardAdd />}
          data-testid="save-to-dashboard-button"
        />
      </AppTooltip>
    </SaveToDashboardDropdown>
  );
});

SaveMetricToDashboardButton.displayName = 'SaveMetricToDashboardButton';
