import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat/chatMessageInterfaces';
import { useGetDashboard, usePrefetchGetDashboardClient } from '@/api/buster_rest/dashboards';
import React, { useMemo } from 'react';
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
import { useMount } from '@/hooks';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext';
import { ChartType, DEFAULT_CHART_CONFIG } from '@/api/asset_interfaces/metric';
import { useGetMetricMemoized } from '@/context/Metrics';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { getSelectedChartTypeConfig } from '@/lib/metrics/selectedChartType';
import { Text } from '@/components/ui/typography';
import Link from 'next/link';

export const ChatResponseMessage_DashboardFile: React.FC<{
  isCompletedStream: boolean;
  responseMessage: BusterChatResponseMessage_file;
  isSelectedFile: boolean;
  chatId: string;
  href: string;
}> = React.memo(({ isCompletedStream, responseMessage, isSelectedFile, chatId, href }) => {
  const { version_number, id, file_name } = responseMessage;
  const metricId = useChatLayoutContextSelector((x) => x.metricId);
  const prefetchGetDashboard = usePrefetchGetDashboardClient();
  const {
    data: dashboardResponse,
    isError,
    isFetched,
    isLoading
  } = useGetDashboard(
    {
      id,
      versionNumber: version_number
    },
    {
      select: ({ dashboard, metrics }) => {
        return { dashboard, metrics };
      }
    }
  );

  const HeaderWrapper = useMemo(() => {
    const Component = ({ children }: { children: React.ReactNode }) => (
      <Link href={href} passHref prefetch>
        {children}
      </Link>
    );
    Component.displayName = 'HeaderWrapper';
    return Component;
  }, [href]);

  useMount(() => {
    if (isSelectedFile) prefetchGetDashboard(id, version_number);
  });

  return (
    <AnimatePresence initial={!isCompletedStream}>
      <motion.div
        id={id}
        {...itemAnimationConfig}
        onMouseEnter={() => {
          prefetchGetDashboard(id, version_number);
        }}>
        <FileCard
          className={cn(
            'overflow-hidden',
            isSelectedFile && 'border-foreground shadow-md transition-all duration-200',
            !isSelectedFile && 'hover:border-gray-light'
          )}
          collapseContent={true}
          collapsible={isFetched && !isError}
          collapseDefaultIcon={<HeaderIcon isLoading={isLoading} isError={isError} />}
          headerClassName="bg-background"
          fileName={<TextAndVersionPill fileName={file_name} versionNumber={version_number} />}
          headerWrapper={HeaderWrapper}>
          {dashboardResponse && (
            <Content
              dashboardResponse={dashboardResponse}
              isFetched={isFetched}
              isError={isError}
              metricId={metricId}
              chatId={chatId}
              isSelectedFile={isSelectedFile}
            />
          )}
        </FileCard>
      </motion.div>
    </AnimatePresence>
  );
});

ChatResponseMessage_DashboardFile.displayName = 'ChatResponseMessage_DashboardFile';

const HeaderIcon: React.FC<{
  isLoading: boolean;
  isError: boolean;
}> = React.memo(({ isLoading, isError }) => {
  if (isLoading) {
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
  dashboardResponse: Pick<BusterDashboardResponse, 'dashboard' | 'metrics'>;
  isFetched: boolean;
  isError: boolean;
  metricId: string | undefined;
  chatId: string;
  isSelectedFile: boolean;
}> = React.memo(({ dashboardResponse, chatId, metricId, isSelectedFile, isFetched, isError }) => {
  const getMetricMemoized = useGetMetricMemoized();

  type RowItem = {
    id: string;
    name: string;
    chartType: ChartType;
    link: string;
    isSelectedMetric: boolean;
    icon: React.ReactNode;
    iconTooltip: string;
  };

  const items: RowItem[] = useMemo(() => {
    const rows = dashboardResponse.dashboard.config.rows || [];
    return rows.reduce<RowItem[]>((acc, row) => {
      return [
        ...acc,
        ...row.items.map((item) => {
          const metricFromDashboardResponse = dashboardResponse.metrics[item.id];
          const metric =
            getMetricMemoized(item.id, metricFromDashboardResponse?.version_number) ||
            metricFromDashboardResponse;
          const chartType =
            metric.chart_config?.selectedChartType || DEFAULT_CHART_CONFIG.selectedChartType;
          const selectedChartIconConfig = getSelectedChartTypeConfig({
            selectedChartType: chartType,
            lineGroupType: metric.chart_config?.lineGroupType,
            barGroupType: metric.chart_config?.barGroupType,
            barLayout: metric.chart_config?.barLayout,
            hasAreaStyle: false
          });

          return {
            id: item.id,
            name: metric.file_name || 'Untitled',
            chartType,
            link: createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
              chatId,
              metricId: metric.id,
              versionNumber: metric.version_number
            }),
            isSelectedMetric: metric.id === metricId && isSelectedFile,
            icon: selectedChartIconConfig?.icon ? <selectedChartIconConfig.icon /> : null,
            iconTooltip: selectedChartIconConfig?.tooltipText || ''
          };
        })
      ];
    }, []);
  }, [
    dashboardResponse.dashboard,
    dashboardResponse.metrics,
    isFetched,
    metricId,
    chatId,
    getMetricMemoized
  ]);

  return (
    <div
      className="flex flex-col gap-y-2.5 px-3.5 py-2"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}>
      {items.map((item) => (
        <div
          className="flex items-center justify-between space-x-2.5 overflow-hidden"
          key={item.id}>
          <Link href={item.link} passHref prefetch className="truncate">
            <Text
              truncate
              size={'sm'}
              className="cursor-pointer hover:underline"
              variant={item.isSelectedMetric ? 'default' : 'secondary'}>
              {item.name}
            </Text>
          </Link>

          <AppTooltip title={item.iconTooltip} delayDuration={300}>
            <div className="flex items-center justify-center text-sm">{item.icon}</div>
          </AppTooltip>
        </div>
      ))}
    </div>
  );
});

Content.displayName = 'Content';
