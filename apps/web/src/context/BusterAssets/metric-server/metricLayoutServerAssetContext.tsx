import type { AssetType } from '@buster/server-shared/assets';
import type { QueryClient } from '@tanstack/react-query';
import { Outlet } from '@tanstack/react-router';
import { z } from 'zod';
import { prefetchGetMetric } from '@/api/buster_rest/metrics';
import { useGetMetricParams } from '@/context/Metrics/useGetMetricParams';
import { MetricAssetContainer } from '@/layouts/AssetContainer/MetricAssetContainer';

export const validateSearch = z.object({
  metric_version_number: z.coerce.number().optional(),
  dashboard_version_number: z.coerce.number().optional(),
});

export const staticData = {
  assetType: 'metric_file' as AssetType,
};

export const loader = async <T extends { metricId: string; reportId?: string }>({
  params: { metricId, reportId },
  context: { queryClient },
  deps: { metric_version_number },
}: {
  params: T;
  deps: { metric_version_number?: number };
  context: { queryClient: QueryClient };
}): Promise<{
  title: string | undefined;
}> => {
  const data = await prefetchGetMetric(queryClient, {
    id: metricId,
    version_number: metric_version_number,
    report_file_id: reportId,
  });
  return {
    title: data?.name,
  };
};

export const head = ({ loaderData }: { loaderData?: { title: string | undefined } } = {}) => ({
  meta: [
    { title: loaderData?.title || 'Metric' },
    { name: 'description', content: 'View detailed metric analysis and insights' },
    { name: 'og:title', content: 'Metric' },
    { name: 'og:description', content: 'View detailed metric analysis and insights' },
  ],
});

export const component = () => {
  const params = useGetMetricParams();

  return (
    <MetricAssetContainer {...params}>
      <Outlet />
    </MetricAssetContainer>
  );
};

export const ssr = false;
