import { useEffect, useMemo, useRef } from 'react';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { useInViewport } from '@/hooks/useInViewport';
import { useDashboardContentControllerContextSelector } from '../../../../controllers/DashboardController/DashboardViewDashboardController/DashboardContentController/DashboardContentControllerContext';

const stableMetricSelect = ({
  name,
  description,
  time_frame,
  chart_config,
  permission,
  error,
  evaluation_score,
  evaluation_summary,
}: BusterMetric) => ({
  name,
  description,
  time_frame,
  chart_config,
  permission,
  error,
  evaluation_score,
  evaluation_summary,
});

export const useDashboardMetric = ({
  metricId,
  versionNumber,
  cacheId,
}: {
  metricId: string;
  cacheId?: string;
  versionNumber: number | undefined;
}) => {
  const {
    data: metric,
    isFetched: isMetricFetched,
    error: metricError,
  } = useGetMetric(
    { id: metricId, versionNumber, cacheId },
    {
      enabled: !!metricId,
      select: stableMetricSelect,
    }
  );
  const {
    data: metricData,
    isFetched: isFetchedMetricData,
    dataUpdatedAt: metricDataUpdatedAt,
    error: metricDataError,
  } = useGetMetricData({ id: metricId, versionNumber });
  const dashboard = useDashboardContentControllerContextSelector(({ dashboard }) => dashboard);
  const metricMetadata = useDashboardContentControllerContextSelector(
    ({ metricMetadata }) => metricMetadata[metricId]
  );
  const setInitialAnimationEnded = useDashboardContentControllerContextSelector(
    ({ setInitialAnimationEnded }) => setInitialAnimationEnded
  );
  const setHasBeenScrolledIntoView = useDashboardContentControllerContextSelector(
    ({ setHasBeenScrolledIntoView }) => setHasBeenScrolledIntoView
  );

  const isOnFirstTwoRows = useMemo(() => {
    return dashboard.config.rows
      ?.slice(0, 2)
      .some((row) => row.items.some((item) => item.id === metricId));
  }, [dashboard?.id]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [inViewport] = useInViewport(containerRef, {
    threshold: 0.2,
  });

  const initialAnimationEnded = metricMetadata?.initialAnimationEnded || false;
  const renderChart: boolean =
    (metricMetadata?.hasBeenScrolledIntoView || !!isOnFirstTwoRows) && isMetricFetched;

  useEffect(() => {
    if (inViewport) {
      setHasBeenScrolledIntoView(metricId);
    }
  }, [inViewport]);

  return useMemo(
    () => ({
      renderChart,
      metric,
      containerRef,
      metricData,
      metricDataError,
      initialAnimationEnded,
      setInitialAnimationEnded,
      metricDataUpdatedAt,
      isFetchedMetricData,
      isMetricFetched,
      metricError,
    }),
    [
      metricError,
      metricDataError,
      renderChart,
      metric,
      containerRef,
      metricData,
      initialAnimationEnded,
      setInitialAnimationEnded,
      metricDataUpdatedAt,
      isFetchedMetricData,
      isMetricFetched,
    ]
  );
};
