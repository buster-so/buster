import { useEffect, useMemo, useRef } from 'react';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { useInViewport } from '@/hooks';
import { useDashboardContentControllerContextSelector } from '../DashboardContentControllerContext';

export const useDashboardMetric = ({
  metricId,
  versionNumber
}: {
  metricId: string;
  versionNumber: number | undefined;
}) => {
  const {
    data: metric,
    isFetched: isMetricFetched,
    error: metricError
  } = useGetMetric(
    { id: metricId, versionNumber },
    {
      enabled: !!metricId,
      select: ({
        name,
        description,
        time_frame,
        chart_config,
        permission,
        error,
        evaluation_score,
        evaluation_summary
      }) => ({
        name,
        error,
        description,
        time_frame,
        permission,
        evaluation_score,
        evaluation_summary,
        chart_config
      })
    }
  );
  const {
    data: metricData,
    isFetched: isFetchedMetricData,
    dataUpdatedAt: metricDataUpdatedAt,
    error: metricDataError
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

  const conatinerRef = useRef<HTMLDivElement>(null);
  const [inViewport] = useInViewport(conatinerRef, {
    threshold: 0.33
  });

  const initialAnimationEnded = metricMetadata?.initialAnimationEnded || false;
  const renderChart =
    (metricMetadata?.hasBeenScrolledIntoView || isOnFirstTwoRows) && isMetricFetched;

  useEffect(() => {
    if (inViewport) {
      setHasBeenScrolledIntoView(metricId);
    }
  }, [inViewport]);

  return useMemo(
    () => ({
      renderChart,
      metric,
      conatinerRef,
      metricData,
      metricDataError,
      initialAnimationEnded,
      setInitialAnimationEnded,
      metricDataUpdatedAt,
      isFetchedMetricData,
      isMetricFetched,
      metricError
    }),
    [
      metricError,
      metricDataError,
      renderChart,
      metric,
      conatinerRef,
      metricData,
      initialAnimationEnded,
      setInitialAnimationEnded,
      metricDataUpdatedAt,
      isFetchedMetricData,
      isMetricFetched
    ]
  );
};
