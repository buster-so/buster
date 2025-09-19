import React, { useCallback } from 'react';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { CreateChatButton } from '@/components/features/AssetLayout/CreateChatButton';
import { SaveMetricToCollectionButton } from '@/components/features/buttons/SaveMetricToCollectionButton';
import { SaveMetricToDashboardButton } from '@/components/features/buttons/SaveMetricToDashboardButton';
import { ShareMetricButton } from '@/components/features/buttons/ShareMetricButton';
import { ClosePageButton } from '@/components/features/chat/ClosePageButton';
import { MetricThreeDotMenuButton } from '@/components/features/metrics/MetricThreeDotMenu';
import { SelectableButton } from '@/components/ui/buttons/SelectableButton';
import { SquareChartPen } from '@/components/ui/icons';
import { useIsChatMode, useIsFileMode } from '@/context/Chats/useMode';
import { useIsMetricReadOnly } from '@/context/Metrics/useIsMetricReadOnly';
import { canEdit, getIsEffectiveOwner } from '@/lib/share';
import { FileButtonContainer } from '../FileButtonContainer';
import { HideButtonContainer } from '../HideButtonContainer';
import { useIsMetricEditMode, useMetricEditToggle } from './MetricContextProvider';

export const MetricContainerHeaderButtons: React.FC<{
  metricId: string;
  metricVersionNumber: number | undefined;
  cacheId?: string;
}> = React.memo(({ metricId, metricVersionNumber, cacheId }) => {
  const isChatMode = useIsChatMode();
  const isFileMode = useIsFileMode();
  const { isViewingOldVersion } = useIsMetricReadOnly({
    metricId: metricId || '',
  });
  const { error: metricError, data: permission } = useGetMetric(
    { id: metricId, cacheId },
    { select: useCallback((x: BusterMetric) => x.permission, []) }
  );

  //we assume it is fetched until it is not
  if (metricError || !permission) return null;

  const isEditor = canEdit(permission);
  const isEffectiveOwner = getIsEffectiveOwner(permission);

  return (
    <FileButtonContainer>
      {isEditor && !isViewingOldVersion && <EditChartButton />}
      {isEffectiveOwner && !isViewingOldVersion && <ShareMetricButton metricId={metricId} />}
      <MetricThreeDotMenuButton
        metricId={metricId}
        isViewingOldVersion={isViewingOldVersion}
        versionNumber={metricVersionNumber}
      />
      <HideButtonContainer show={isFileMode && isEditor}>
        <CreateChatButton assetId={metricId} assetType="metric_file" />
      </HideButtonContainer>
      {isChatMode && <ClosePageButton />}
    </FileButtonContainer>
  );
});

MetricContainerHeaderButtons.displayName = 'MetricContainerHeaderButtons';

const EditChartButton = React.memo(() => {
  const isChartEditMode = useIsMetricEditMode();
  const toggleEditMode = useMetricEditToggle();

  return (
    <SelectableButton
      tooltipText="Edit chart"
      icon={<SquareChartPen />}
      data-testid="edit-chart-button"
      onClick={() => toggleEditMode()}
      selected={isChartEditMode}
    />
  );
});
EditChartButton.displayName = 'EditChartButton';

const SaveToCollectionButton = React.memo(({ metricId }: { metricId: string }) => {
  return <SaveMetricToCollectionButton metricId={metricId} />;
});
SaveToCollectionButton.displayName = 'SaveToCollectionButton';

const SaveToDashboardButton = React.memo(
  ({ metricId, cacheId }: { metricId: string; cacheId?: string }) => {
    const { data: dashboardIds } = useGetMetric(
      { id: metricId, cacheId },
      { select: useCallback((x: BusterMetric) => x.dashboards?.map((x) => x.id), []) }
    );

    return (
      <SaveMetricToDashboardButton metricIds={[metricId]} selectedDashboards={dashboardIds || []} />
    );
  }
);
SaveToDashboardButton.displayName = 'SaveToDashboardButton';
