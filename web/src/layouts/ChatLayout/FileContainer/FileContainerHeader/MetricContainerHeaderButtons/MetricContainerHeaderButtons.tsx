import React, { useMemo } from 'react';
import { FileContainerButtonsProps } from '../interfaces';
import { MetricFileViewSecondary, useChatLayoutContextSelector } from '../../../ChatLayoutContext';
import { useMemoizedFn } from '@/hooks';
import { useChatIndividualContextSelector } from '../../../ChatContext';
import { HideButtonContainer } from '../HideButtonContainer';
import { FileButtonContainer } from '../FileButtonContainer';
import { CreateChatButton } from '../CreateChatButtont';
import { SelectableButton } from '../SelectableButton';
import { SaveMetricToCollectionButton } from '../../../../../components/features/buttons/SaveMetricToCollectionButton';
import { SaveMetricToDashboardButton } from '../../../../../components/features/buttons/SaveMetricToDashboardButton';
import { ShareMetricButton } from '../../../../../components/features/buttons/ShareMetricButton';
import { SquareChartPen, SquareCode } from '@/components/ui/icons';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { ThreeDotMenuButton } from './MetricThreeDotMenu';
import { canEdit, getIsEffectiveOwner } from '@/lib/share';
import Link from 'next/link';
import { assetParamsToRoute } from '@/lib/assets';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useIsMetricReadOnly } from '@/context/Metrics/useIsMetricReadOnly';

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
        {isEffectiveOwner && !isViewingOldVersion && <EditSQLButton metricId={metricId} />}
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

  const onClickButton = useMemoizedFn(() => {
    onChangePage(href, { shallow: true });
  });

  return (
    <Link
      href={href}
      shallow={true}
      prefetch={true}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}>
      <SelectableButton
        tooltipText="Edit chart"
        icon={<SquareChartPen />}
        onClick={onClickButton}
        selected={isSelectedView}
      />
    </Link>
  );
});
EditChartButton.displayName = 'EditChartButton';

const EditSQLButton = React.memo(({ metricId }: { metricId: string }) => {
  const selectedFileViewSecondary = useChatLayoutContextSelector(
    (x) => x.selectedFileViewSecondary
  );
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);
  const chatId = useChatIndividualContextSelector((x) => x.chatId);
  const metricVersionNumber = useChatLayoutContextSelector((x) => x.metricVersionNumber);
  const editableSecondaryView: MetricFileViewSecondary = 'sql-edit';
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
      secondaryView: 'sql-edit',
      versionNumber: metricVersionNumber
    });
  }, [chatId, metricId, metricVersionNumber]);

  const onClickButton = useMemoizedFn(() => {
    const secondaryView = isSelectedView ? null : editableSecondaryView;
    onSetFileView({ secondaryView, fileView: 'results' });
  });

  return (
    <Link
      href={href}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}>
      <SelectableButton
        tooltipText="SQL editor"
        icon={<SquareCode />}
        onClick={onClickButton}
        selected={isSelectedView}
      />
    </Link>
  );
});
EditSQLButton.displayName = 'EditSQLButton';

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
