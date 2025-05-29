import React from 'react';
import { useGetMetric } from '@/api/buster_rest/metrics';
import type { SegmentedItem } from '@/components/ui/segmented';
import { AppSegmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/typography';
import { useIsMetricReadOnly } from '@/context/Metrics/useIsMetricReadOnly';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import type { FileView } from '../../ChatLayoutContext/useLayoutConfig';
import type { FileContainerSegmentProps } from './interfaces';

export const MetricContainerHeaderSegment: React.FC<FileContainerSegmentProps> = React.memo(
  (props) => {
    const { selectedFileId } = props;
    const { isViewingOldVersion, isFetched, isError } = useIsMetricReadOnly({
      metricId: selectedFileId || ''
    });

    if (!isFetched || isError) return null;

    if (isViewingOldVersion) {
      return <MetricOldVersion />;
    }

    return <MetricSegments {...props} />;
  }
);

MetricContainerHeaderSegment.displayName = 'MetricContainerHeaderSegment';

const MetricSegments: React.FC<FileContainerSegmentProps> = React.memo(
  ({ selectedFileView, chatId }) => {
    const metricId = useChatLayoutContextSelector((x) => x.metricId) || '';
    const { error } = useGetMetric({ id: metricId });

    const segmentOptions: SegmentedItem<FileView>[] = React.useMemo(() => {
      if (chatId) {
        return [
          {
            label: 'Chart',
            value: 'chart',
            link: createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
              chatId,
              metricId
            })
          },
          {
            label: 'Results',
            value: 'results',
            link: createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_METRIC_ID_RESULTS,
              chatId,
              metricId
            })
          },
          {
            label: 'SQL',
            value: 'sql',
            link: createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_METRIC_ID_SQL,
              chatId,
              metricId
            })
          }
        ];
      }

      return [
        {
          label: 'Chart',
          value: 'chart',
          link: createBusterRoute({ route: BusterRoutes.APP_METRIC_ID_CHART, metricId })
        },
        {
          label: 'Results',
          value: 'results',
          link: createBusterRoute({ route: BusterRoutes.APP_METRIC_ID_RESULTS, metricId })
        },
        {
          label: 'SQL',
          value: 'sql',
          link: createBusterRoute({ route: BusterRoutes.APP_METRIC_ID_SQL, metricId })
        }
      ];
    }, [chatId, error, metricId]);

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
