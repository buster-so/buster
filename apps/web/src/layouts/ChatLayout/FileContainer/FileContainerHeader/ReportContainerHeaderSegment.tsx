import React from 'react';
import { useGetReport } from '@/api/buster_rest/reports';
import type { SegmentedItem } from '@/components/ui/segmented';
import { AppSegmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/typography';
import { useIsReportReadOnly } from '@/context/Reports/useIsReportReadOnly';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import type { FileView } from '../../ChatLayoutContext/useLayoutConfig';
import type { FileContainerSegmentProps } from './interfaces';
import { assetParamsToRoute } from '@/lib/assets';

export const ReportContainerHeaderSegment: React.FC<FileContainerSegmentProps> = (props) => {
  const { selectedFileId, overrideOldVersionMessage } = props;
  const { isViewingOldVersion, isFetched, isError } = useIsReportReadOnly({
    reportId: selectedFileId || ''
  });

  if (!isFetched || isError) return null;

  if (isViewingOldVersion && !overrideOldVersionMessage) {
    return <ReportOldVersion />;
  }

  return <ReportSegments {...props} />;
};

ReportContainerHeaderSegment.displayName = 'ReportContainerHeaderSegment';

const ReportSegments: React.FC<FileContainerSegmentProps> = React.memo(
  ({ selectedFileView, chatId, isVersionHistoryMode }) => {
    const reportId = useChatLayoutContextSelector((x) => x.reportId) || '';
    const reportVersionNumber = useChatLayoutContextSelector((x) => x.reportVersionNumber);
    const { error } = useGetReport({ reportId: reportId });

    const segmentOptions: SegmentedItem<FileView>[] = React.useMemo(() => {
      return [
        {
          label: 'Report',
          value: 'report',
          link: assetParamsToRoute({
            chatId,
            assetId: reportId,
            type: 'report'
          })
        },
        {
          label: 'Files',
          value: 'file',
          link: assetParamsToRoute({
            chatId,
            assetId: reportId,
            type: 'report',
            page: 'file'
          })
        }
      ];
    }, [chatId, error, reportId, reportVersionNumber, isVersionHistoryMode]);

    return <AppSegmented type="button" options={segmentOptions} value={selectedFileView} />;
  }
);

ReportSegments.displayName = 'ReportSegments';

const ReportOldVersion: React.FC = () => {
  return (
    <Text truncate variant={'secondary'}>
      You are viewing an old version of this report
    </Text>
  );
};
