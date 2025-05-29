import { useGetMetric } from '@/api/buster_rest/metrics';
import { SquareChartPen } from '@/components/ui/icons';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useIsMetricReadOnly } from '@/context/Metrics/useIsMetricReadOnly';
import { useMemoizedFn } from '@/hooks';
import { assetParamsToRoute } from '@/lib/assets';
import { canEdit, getIsEffectiveOwner } from '@/lib/share';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { SaveMetricToCollectionButton } from '../../../../../components/features/buttons/SaveMetricToCollectionButton';
import { SaveMetricToDashboardButton } from '../../../../../components/features/buttons/SaveMetricToDashboardButton';
import { ShareMetricButton } from '../../../../../components/features/buttons/ShareMetricButton';
import { useChatIndividualContextSelector } from '../../../ChatContext';
import {
  type MetricFileViewSecondary,
  useChatLayoutContextSelector
} from '../../../ChatLayoutContext';
import { CreateChatButton } from '../CreateChatButtont';
import { FileButtonContainer } from '../FileButtonContainer';
import { HideButtonContainer } from '../HideButtonContainer';
import { SelectableButton } from '../SelectableButton';
import type { FileContainerButtonsProps } from '../interfaces';
import { ThreeDotMenuButton } from './MetricThreeDotMenu';

export const MetricContainerHeaderButtons: React.FC<FileContainerButtonsProps> = React.memo(
  ({ selectedFileId }) => {
    const selectedLayout = useChatLayoutContextSelector((x) => x.selectedLayout);
    const metricId = selectedFileId || '';
    const metricVersionNumber = useChatLayoutContextSelector((x) => x.metricVersionNumber);
    const { isViewingOldVersion } = useIsMetricReadOnly({
      metricId: metricId || ''
    });
    const { error: metricError, data: permission } = useGetMetric(
      { id: metricId },
      { select: (x) => x.permission }
    );

    //we assume it is fetched until it is not
    if (metricError || !permission) return null;

    const isEditor = canEdit(permission);
    const isEffectiveOwner = getIsEffectiveOwner(permission);

    return (
      <FileButtonContainer>
        {isEditor && !isViewingOldVersion && <EditChartButton metricId={metricId} />}
        <SaveToCollectionButton metricId={metricId} />
        <SaveToDashboardButton metricId={metricId} />
        {isEffectiveOwner && !isViewingOldVersion && <ShareMetricButton metricId={metricId} />}
        <ThreeDotMenuButton
          metricId={metricId}
          isViewingOldVersion={isViewingOldVersion}
          versionNumber={metricVersionNumber}
        />
        <HideButtonContainer show={selectedLayout === 'file-only'}>
          <CreateChatButton assetId={metricId} assetType="metric" />
        </HideButtonContainer>
      </FileButtonContainer>
    );
  }
);

MetricContainerHeaderButtons.displayName = 'MetricContainerHeaderButtons';

const EditChartButton = React.memo(({ metricId }: { metricId: string }) => {
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const selectedFileViewSecondary = useChatLayoutContextSelector(
    (x) => x.selectedFileViewSecondary
  );
  const chatId = useChatIndividualContextSelector((x) => x.chatId);
  const metricVersionNumber = useChatLayoutContextSelector((x) => x.metricVersionNumber);
  const editableSecondaryView: MetricFileViewSecondary = 'chart-edit';
  const isSelectedView = selectedFileViewSecondary === editableSecondaryView;

  const href = useMemo(() => {
    if (isSelectedView) {
      return assetParamsToRoute({
        chatId,
        assetId: metricId,
        type: 'metric',
        secondaryView: null,
        versionNumber: metricVersionNumber
      });
    }

    return assetParamsToRoute({
      chatId,
      assetId: metricId,
      type: 'metric',
      secondaryView: 'chart-edit',
      versionNumber: metricVersionNumber
    });
  }, [chatId, metricId, isSelectedView, metricVersionNumber]);

  //I HAVE NO IDEA WHY... but onClickButton is called twice if wrapped in a link
  const onClickButton = useMemoizedFn(() => {
    onChangePage(href, { shallow: true });
  });

  return (
    <Link
      href={href}
      shallow={true}
      prefetch={true}
      passHref
      data-testid="edit-chart-button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClickButton();
      }}>
      <SelectableButton
        tooltipText="Edit chart"
        icon={<SquareChartPen />}
        selected={isSelectedView}
      />
    </Link>
  );
});
EditChartButton.displayName = 'EditChartButton';

const SaveToCollectionButton = React.memo(({ metricId }: { metricId: string }) => {
  const { data: collections } = useGetMetric(
    { id: metricId },
    { select: (x) => x.collections?.map((x) => x.id) }
  );

  return (
    <SaveMetricToCollectionButton metricIds={[metricId]} selectedCollections={collections || []} />
  );
});
SaveToCollectionButton.displayName = 'SaveToCollectionButton';

const SaveToDashboardButton = React.memo(({ metricId }: { metricId: string }) => {
  const { data: dashboardIds } = useGetMetric(
    { id: metricId },
    { select: (x) => x.dashboards?.map((x) => x.id) }
  );

  return (
    <SaveMetricToDashboardButton metricIds={[metricId]} selectedDashboards={dashboardIds || []} />
  );
});
SaveToDashboardButton.displayName = 'SaveToDashboardButton';
