import React from 'react';
import { useGetMetric } from '@/api/buster_rest/metrics';
import type { SegmentedItem } from '@/components/ui/segmented';
import { AppSegmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/typography';
import { useIsMetricReadOnly } from '@/context/Metrics/useIsMetricReadOnly';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import type { FileView, MetricFileViewSecondary } from '../../ChatLayoutContext/useLayoutConfig';
import type { FileContainerSegmentProps } from './interfaces';
import { assetParamsToRoute } from '@/lib/assets';

export const MetricContainerHeaderSegment: React.FC<FileContainerSegmentProps> = React.memo(
  (props) => {
    const { selectedFileId, overrideOldVersionMessage } = props;
    const { isViewingOldVersion, isFetched, isError } = useIsMetricReadOnly({
      metricId: selectedFileId || ''
    });

    if (!isFetched || isError) return null;

    if (isViewingOldVersion && !overrideOldVersionMessage) {
      return <MetricOldVersion />;
    }

    return <MetricSegments {...props} />;
  }
);

MetricContainerHeaderSegment.displayName = 'MetricContainerHeaderSegment';

const MetricSegments: React.FC<FileContainerSegmentProps> = React.memo(
  ({ selectedFileView, chatId, isVersionHistoryMode }) => {
    const metricId = useChatLayoutContextSelector((x) => x.metricId) || '';
    const dashboardId = useChatLayoutContextSelector((x) => x.dashboardId) || '';
    const metricVersionNumber = useChatLayoutContextSelector((x) => x.metricVersionNumber);
    const dashboardVersionNumber = useChatLayoutContextSelector((x) => x.dashboardVersionNumber);
    const { error } = useGetMetric({ id: metricId });

    const segmentOptions: SegmentedItem<FileView>[] = React.useMemo(() => {
      const secondaryView: MetricFileViewSecondary | undefined = isVersionHistoryMode
        ? 'version-history'
        : undefined;

      return [
        {
          label: 'Chart',
          value: 'chart',
          link: assetParamsToRoute({
            page: 'chart',
            chatId,
            dashboardId,
            assetId: metricId,
            type: 'metric',
            metricVersionNumber,
            secondaryView
          })
        },
        {
          label: 'Results',
          value: 'results',
          link: assetParamsToRoute({
            page: 'results',
            chatId,
            dashboardId,
            assetId: metricId,
            type: 'metric',
            metricVersionNumber,
            secondaryView
          })
        },
        {
          label: 'SQL',
          value: 'sql',
          link: assetParamsToRoute({
            page: 'sql',
            chatId,
            dashboardId,
            assetId: metricId,
            type: 'metric',
            metricVersionNumber,
            secondaryView
          })
        }
      ];
    }, [
      chatId,
      error,
      metricId,
      dashboardId,
      metricVersionNumber,
      dashboardVersionNumber,
      isVersionHistoryMode
    ]);

    return <AppSegmented type="button" options={segmentOptions} value={selectedFileView} />;
  }
);

MetricSegments.displayName = 'MetricSegments';

const MetricOldVersion: React.FC = () => {
  return (
    <Text truncate variant={'secondary'}>
      You are viewing an old version of this metric
    </Text>
  );
};
