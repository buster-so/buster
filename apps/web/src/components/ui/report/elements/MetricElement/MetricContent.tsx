import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { MetricCard } from '@/components/ui/metric';
import { useInViewport } from '@/hooks/useInViewport';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { assetParamsToRoute } from '@/lib/assets/assetParamsToRoute';
import React, { useMemo, useRef } from 'react';
import { useMetricContentThreeDotMenuItems } from './useMetricContentThreeDotMenuItems';
import { cn } from '@/lib/utils';

export const MetricContent = React.memo(
  ({
    metricId,
    metricVersionNumber,
    isExportMode = false,
    readOnly = false,
    className
  }: {
    metricId: string;
    metricVersionNumber: number | undefined;
    readOnly?: boolean;
    isExportMode?: boolean;
    className?: string;
  }) => {
    const chatId = useChatLayoutContextSelector((x) => x.chatId);
    const reportId = useChatLayoutContextSelector((x) => x.reportId) || '';
    const reportVersionNumber = useChatLayoutContextSelector((x) => x.reportVersionNumber);
    const ref = useRef<HTMLDivElement>(null);
    const hasBeenInViewport = useRef(false);

    const [inViewport] = useInViewport(ref, {
      threshold: 0.33
    });
    if (inViewport && !hasBeenInViewport.current) {
      hasBeenInViewport.current = true;
    }
    const renderChart = inViewport || isExportMode || hasBeenInViewport.current;

    const {
      data: metric,
      isFetched: isFetchedMetric,
      error: metricError
    } = useGetMetric(
      {
        id: metricId,
        versionNumber: metricVersionNumber
      },
      { enabled: !!metricId }
    );
    const {
      data: metricData,
      isFetched: isFetchedMetricData,
      error: metricDataError
    } = useGetMetricData({
      id: metricId,
      versionNumber: metricVersionNumber,
      reportFileId: reportId || undefined
    });

    const link = useMemo(() => {
      return assetParamsToRoute({
        type: 'metric',
        chatId,
        assetId: metricId,
        reportId,
        metricId,
        versionNumber: metricVersionNumber || undefined
      });
    }, [chatId, reportId, metricId, metricVersionNumber]);

    const threeDotMenuItems = useMetricContentThreeDotMenuItems({
      metricId,
      metricVersionNumber,
      reportId,
      reportVersionNumber,
      chatId
    });

    const error: string | undefined =
      metric?.error || metricDataError?.message || metricError?.message || undefined;

    return (
      <MetricCard
        className={cn('transition-all duration-100', className)}
        ref={ref}
        metricLink={link}
        animate={!isExportMode}
        metricId={metricId}
        readOnly={readOnly}
        isDragOverlay={false}
        metric={metric}
        metricData={metricData}
        renderChart={renderChart}
        loading={(!isFetchedMetric || !isFetchedMetricData) && !metricError}
        error={error}
        threeDotMenuItems={threeDotMenuItems}
      />
    );
  }
);

MetricContent.displayName = 'MetricContent';
