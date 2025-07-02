import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat/chatMessageInterfaces';
import { useGetDashboard, usePrefetchGetDashboardClient } from '@/api/buster_rest/dashboards';
import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
import { CollapisbleFileCard } from '@/components/ui/card/CollapisbleFileCard';
import { ShimmerText } from '@/components/ui/typography/ShimmerText';
import { TextAndVersionText } from '@/components/ui/typography/TextAndVersionText';
import { Button } from '@/components/ui/buttons';

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
    { id, versionNumber: version_number },
    { select: ({ dashboard, metrics }) => ({ dashboard, metrics }) }
  );

  const hasMetrics = Object.keys(dashboardResponse?.metrics || {}).length > 0;

  const HeaderWrapper = useMemo(() => {
    if (metricId) {
      return React.Fragment;
    }

    const Component = ({ children }: { children: React.ReactNode }) => (
      <Link href={href} passHref prefetch>
        {children}
      </Link>
    );
    Component.displayName = 'HeaderWrapper';
    return Component;
  }, [href, metricId]);

  const FileInfo = useMemo(() => {
    if (metricId) {
      return (
        <SelectDashboardButtonAndText
          fileName={file_name}
          dashboardId={id}
          chatId={chatId}
          versionNumber={version_number}
        />
      );
    }

    return <TextAndVersionText text={file_name} version={version_number} />;
  }, [file_name, version_number, metricId]);

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
        <CollapisbleFileCard
          collapseContent={true}
          collapsible={hasMetrics ? 'chevron' : false}
          selected={isSelectedFile}
          collapseDefaultIcon={<HeaderIcon isLoading={isLoading} isError={isError} />}
          fileName={FileInfo}
          headerWrapper={HeaderWrapper}>
          {!hasMetrics ? null : dashboardResponse ? (
            <Content
              dashboardResponse={dashboardResponse}
              isFetched={isFetched}
              metricId={metricId}
              chatId={chatId}
            />
          ) : (
            <ShimmerText text="Loading..." />
          )}
        </CollapisbleFileCard>
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
  metricId: string | undefined;
  chatId: string;
}> = React.memo(({ dashboardResponse, chatId, metricId, isFetched }) => {
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
            isSelectedMetric: metric.id === metricId,
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

const SelectDashboardButtonAndText: React.FC<{
  chatId: string;
  dashboardId: string;
  fileName: string;
  versionNumber: number;
}> = React.memo(({ fileName, dashboardId, chatId, versionNumber }) => {
  return (
    <div className="flex w-full items-center justify-between space-x-1.5 overflow-hidden">
      <Text size={'base'} truncate>
        {fileName}
      </Text>
      <Link
        href={createBusterRoute({
          route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_NUMBER,
          chatId,
          dashboardId,
          versionNumber
        })}>
        <Button size={'small'} variant={'default'} className="min-w-fit">
          View dashboard
        </Button>
      </Link>
    </div>
  );
});

SelectDashboardButtonAndText.displayName = 'SelectDashboardButtonAndText';
