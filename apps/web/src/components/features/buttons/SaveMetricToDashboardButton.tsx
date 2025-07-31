import React, { useState } from 'react';
import {
  useAddMetricsToDashboard,
  useRemoveMetricsFromDashboard
} from '@/api/buster_rest/dashboards';
import { Button } from '@/components/ui/buttons';
import { AppTooltip } from '@/components/ui/tooltip';
import { useMemoizedFn } from '@/hooks';
import { ASSET_ICONS } from '../config/assetIcons';
import { SaveToDashboardDropdown } from '../dropdowns/SaveToDashboardDropdown';

export const SaveMetricToDashboardButton: React.FC<{
  metricIds: string[];
  disabled?: boolean;
  selectedDashboards: string[];
}> = React.memo(({ metricIds, disabled = false, selectedDashboards }) => {
  const { mutateAsync: saveMetricsToDashboard } = useAddMetricsToDashboard();
  const { mutateAsync: removeMetricsFromDashboard } = useRemoveMetricsFromDashboard();

  const onSaveToDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
    await Promise.all(
      dashboardIds.map((dashboardId) => saveMetricsToDashboard({ metricIds, dashboardId }))
    );
  });

  const onRemoveFromDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
    await Promise.all(
      dashboardIds.map((dashboardId) =>
        removeMetricsFromDashboard({ useConfirmModal: false, metricIds, dashboardId })
      )
    );
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
