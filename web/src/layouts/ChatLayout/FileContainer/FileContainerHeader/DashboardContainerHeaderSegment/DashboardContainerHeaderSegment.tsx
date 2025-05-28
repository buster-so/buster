import { AppSegmented } from '@/components/ui/segmented';
import type { SegmentedItem } from '@/components/ui/segmented';
import { Text } from '@/components/ui/typography';
import { useIsDashboardReadOnly } from '@/context/Dashboards/useIsDashboardReadOnly';
import { useMemoizedFn } from '@/hooks';
import { BusterRoutes, createBusterRoute } from '@/routes';
import React, { useMemo } from 'react';
import { useChatLayoutContextSelector } from '../../../ChatLayoutContext';
import type { FileView } from '../../../ChatLayoutContext/useLayoutConfig';
import type { FileContainerSegmentProps } from '../interfaces';

export const DashboardContainerHeaderSegment: React.FC<FileContainerSegmentProps> = React.memo(
  (props) => {
    const { selectedFileId } = props;
    const { isViewingOldVersion, isFetched, isError } = useIsDashboardReadOnly({
      dashboardId: selectedFileId || ''
    });

    if (!isFetched || isError) return null;

    if (isViewingOldVersion) {
      return <DashboardOldVersion />;
    }

    return <DashboardSegments {...props} />;
  }
);

DashboardContainerHeaderSegment.displayName = 'DashboardContainerHeaderSegment';

const DashboardOldVersion: React.FC = () => {
  return (
    <Text truncate variant={'secondary'}>
      You are viewing an old version of this dashboard
    </Text>
  );
};

const DashboardSegments: React.FC<FileContainerSegmentProps> = ({
  selectedFileView,
  chatId,
  selectedFileId
}) => {
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);

  const onChange = useMemoizedFn((fileView: SegmentedItem<FileView>) => {
    onSetFileView({ fileView: fileView.value });
  });

  const segmentOptions: SegmentedItem<FileView>[] = useMemo(() => {
    if (chatId) {
      return [
        {
          label: 'Dashboard',
          value: 'dashboard',
          link: createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
            dashboardId: selectedFileId || '',
            chatId
          })
        },
        {
          label: 'File',
          value: 'file',
          link: createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_FILE,
            dashboardId: selectedFileId || '',
            chatId
          })
        }
      ];
    }

    return [
      {
        label: 'Dashboard',
        value: 'dashboard',
        link: createBusterRoute({
          route: BusterRoutes.APP_DASHBOARD_ID,
          dashboardId: selectedFileId || ''
        })
      },
      {
        label: 'File',
        value: 'file',
        link: createBusterRoute({
          route: BusterRoutes.APP_DASHBOARD_ID_FILE,
          dashboardId: selectedFileId || ''
        })
      }
    ];
  }, [chatId, selectedFileId]);

  return (
    <AppSegmented
      type="button"
      options={segmentOptions}
      value={selectedFileView}
      onChange={onChange}
    />
  );
};
