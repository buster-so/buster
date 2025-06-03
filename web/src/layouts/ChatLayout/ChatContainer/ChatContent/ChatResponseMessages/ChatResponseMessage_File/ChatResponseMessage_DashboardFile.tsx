import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat/chatMessageInterfaces';
import { useGetDashboard, usePrefetchGetDashboardClient } from '@/api/buster_rest/dashboards';
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/classMerge';
import { FileCard } from '@/components/ui/card/FileCard';
import { TextAndVersionPill } from '@/components/ui/typography/TextAndVersionPill';
import { itemAnimationConfig } from '@/components/ui/streaming/animationConfig';
import { BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import { CircleSpinnerLoader } from '@/components/ui/loaders/CircleSpinnerLoader';
import { CircleXmark } from '@/components/ui/icons';
import { ASSET_ICONS } from '@/components/features/config/assetIcons';
import { AppTooltip } from '@/components/ui/tooltip';
import { CHART_ICON_LIST } from '@/controllers/MetricController/MetricViewChart/MetricEditController/MetricStylingApp/StylingAppVisualize/SelectChartType/config';
import { useMount } from '@/hooks';
import { prefetchGetDashboard } from '@/api/buster_rest/dashboards/queryServerRequests';

export const ChatResponseMessage_DashboardFile: React.FC<{
  isCompletedStream: boolean;
  responseMessage: BusterChatResponseMessage_file;
  isSelectedFile: boolean;
}> = React.memo(({ isCompletedStream, responseMessage, isSelectedFile }) => {
  const { version_number, id, file_name } = responseMessage;
  const prefetchGetDashboard = usePrefetchGetDashboardClient();
  const {
    data: dashboard,
    isError,
    isFetched
  } = useGetDashboard(
    {
      id,
      versionNumber: version_number
    },
    {
      select: (data) => {
        return data.dashboard;
      }
    }
  );

  useMount(() => {
    prefetchGetDashboard(id, version_number);
  });

  if (isError) {
    return <div>Error</div>;
  }

  if (!isFetched) {
    return <div>Loading...</div>;
  }

  return (
    <AnimatePresence initial={!isCompletedStream}>
      <motion.div id={id} {...itemAnimationConfig}>
        <FileCard
          className={cn(
            'overflow-hidden',
            isSelectedFile &&
              'border-foreground hover:border-gray-light shadow-md transition-all duration-200'
          )}
          collapseContent={true}
          collapsible={isFetched && !isError}
          collapseDefaultIcon={<HeaderIcon isFetched={isFetched} isError={isError} />}
          headerClassName="bg-background"
          fileName={<TextAndVersionPill fileName={file_name} versionNumber={version_number} />}>
          {dashboard && <Content dashboard={dashboard} />}
        </FileCard>
      </motion.div>
    </AnimatePresence>
  );
});

ChatResponseMessage_DashboardFile.displayName = 'ChatResponseMessage_DashboardFile';

const HeaderIcon: React.FC<{
  isFetched: boolean;
  isError: boolean;
}> = React.memo(({ isFetched, isError }) => {
  if (!isFetched) {
    return <CircleSpinnerLoader size={12} />;
  }

  if (isError) {
    return (
      <AppTooltip title="Error fetching dashboard">
        <CircleXmark />
      </AppTooltip>
    );
  }

  return <ASSET_ICONS.dashboards />;
});

HeaderIcon.displayName = 'HeaderIcon';

const Content: React.FC<{
  dashboard: BusterDashboardResponse['dashboard'];
}> = React.memo(({ dashboard }) => {
  return <div>Content</div>;
});

Content.displayName = 'Content';
