'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/card/CardBase';
import { BusterChartDynamic } from '@/components/ui/charts/BusterChartDynamic';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { MetricTitle } from './MetricTitle';
import { useDashboardMetric } from './useDashboardMetric';
import { assetParamsToRoute } from '@/lib/assets';

const DashboardMetricItemBase: React.FC<{
  metricId: string;
  metricVersionNumber: number | undefined;
  dashboardVersionNumber: number | undefined;
  chatId: string | undefined;
  dashboardId: string;
  numberOfMetrics: number;
  className?: string;
  isDragOverlay?: boolean;
  readOnly?: boolean;
}> = ({
  readOnly,
  dashboardId,
  metricVersionNumber,
  className = '',
  metricId,
  isDragOverlay = false,
  numberOfMetrics,
  chatId,
  dashboardVersionNumber
}) => {
  const {
    conatinerRef,
    renderChart,
    metric,
    metricData,
    initialAnimationEnded,
    setInitialAnimationEnded,
    isFetchedMetricData,
    metricError,
    metricDataError
  } = useDashboardMetric({ metricId, versionNumber: metricVersionNumber });

  const loadingMetricData = !!metric && !isFetchedMetricData;
  const chartOptions = metric?.chart_config;
  const data = metricData?.data || null;
  const loading = loadingMetricData;
  const dataLength = metricData?.data?.length || 1;
  const animate =
    !initialAnimationEnded && !isDragOverlay && dataLength < 125 && numberOfMetrics <= 30;
  const isTable = metric?.chart_config.selectedChartType === 'table';

  const error: string | undefined = useMemo(
    () => metric?.error || metricDataError?.message || metricError?.message || undefined,
    [metric?.error, metricDataError, metricError]
  );

  const metricLink = useMemo(() => {
    return assetParamsToRoute({
      type: 'metric',
      assetId: metricId,
      chatId,
      dashboardId,
      page: 'chart'
    });
  }, [metricId, chatId, dashboardId]);

  const onInitialAnimationEndPreflight = useMemoizedFn(() => {
    setInitialAnimationEnded(metricId);
  });

  const hideChart = useMemo(() => {
    return isDragOverlay && data && data.length > 50;
  }, [isDragOverlay, data?.length]);

  return (
    <Card
      ref={conatinerRef}
      className={`metric-item flex h-full w-full flex-col overflow-auto ${className}`}>
      <CardHeader
        size="small"
        data-testid={`metric-item-${metricId}`}
        className="hover:bg-item-hover group min-h-13! justify-center overflow-hidden border-b px-4 py-2">
        <MetricTitle
          name={metric?.name || ''}
          timeFrame={metric?.time_frame}
          metricLink={metricLink}
          isDragOverlay={isDragOverlay}
          metricId={metricId}
          dashboardId={dashboardId}
          readOnly={readOnly}
          description={metric?.description}
        />
      </CardHeader>

      <div
        className={cn(
          'h-full w-full overflow-hidden bg-transparent',
          isTable ? '' : 'p-3',
          isDragOverlay ? 'pointer-events-none' : 'pointer-events-auto'
        )}>
        {renderChart &&
          chartOptions &&
          (!hideChart ? (
            <BusterChartDynamic
              data={data}
              loading={loading}
              error={error}
              onInitialAnimationEnd={onInitialAnimationEndPreflight}
              animate={!isDragOverlay && animate}
              animateLegend={false}
              columnMetadata={metricData?.data_metadata?.column_metadata}
              readOnly={true}
              {...chartOptions}
            />
          ) : (
            <div className="bg-gray-light/10 h-full w-full rounded" />
          ))}
      </div>
    </Card>
  );
};

export const DashboardMetricItem = React.memo(DashboardMetricItemBase);
