import React, { useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/card/CardBase';
import { useDashboardMetric } from './useDashboardMetric';
import { MetricTitle } from './MetricTitle';
import { createBusterRoute, BusterRoutes } from '@/routes';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { BusterChart } from '@/components/ui/charts/BusterChart';

const DashboardMetricItemBase: React.FC<{
  metricId: string;
  dashboardId: string;
  numberOfMetrics: number;
  className?: string;
  isDragOverlay?: boolean;
  readOnly?: boolean;
}> = ({
  readOnly,
  dashboardId,
  className = '',
  metricId,
  isDragOverlay = false,
  numberOfMetrics
}) => {
  const {
    conatinerRef,
    renderChart,
    metric,
    metricData,
    initialAnimationEnded,
    setInitialAnimationEnded,
    isFetchedMetricData
  } = useDashboardMetric({ metricId });

  const loadingMetricData = !!metric && !isFetchedMetricData;
  const chartOptions = metric?.chart_config;
  const data = metricData?.data || null;
  const loading = loadingMetricData;
  const dataLength = metricData?.data?.length || 1;
  const animate =
    !initialAnimationEnded && !isDragOverlay && dataLength < 125 && numberOfMetrics <= 30;
  const isTable = metric?.chart_config.selectedChartType === 'table';

  const error = useMemo(() => {
    if (metric?.error) {
      return metric.error;
    }

    return undefined;
  }, [metric?.error]);

  const metricLink = useMemo(() => {
    return createBusterRoute({
      route: BusterRoutes.APP_METRIC_ID,
      metricId: metricId
    });
  }, [metricId]);

  const onInitialAnimationEndPreflight = useMemoizedFn(() => {
    setInitialAnimationEnded(metricId);
  });

  if (!chartOptions) return null;

  return (
    <Card
      ref={conatinerRef}
      className={`metric-item flex h-full w-full flex-col overflow-auto ${className}`}>
      <CardHeader
        size="small"
        className="hover:bg-item-hover group h-12 justify-center overflow-hidden border-b p-0!">
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
          `h-full w-full overflow-hidden bg-transparent`,
          isDragOverlay ? 'pointer-events-none' : 'pointer-events-auto'
        )}>
        {renderChart && (
          <BusterChart
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
        )}
      </div>
    </Card>
  );
};

export const DashboardMetricItem = React.memo(DashboardMetricItemBase, (prev, next) => {
  return prev.metricId === next.metricId && prev.dashboardId === next.dashboardId;
});
