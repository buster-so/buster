import type { AssetType } from '@buster/server-shared/assets';
import type { QueryClient } from '@tanstack/react-query';
import { prefetchGetMetric } from '@/api/buster_rest/metrics';
import { useGetMetricParams } from '@/context/Metrics/useGetMetricParams';
import { MetricViewChartController } from '@/controllers/MetricController/MetricViewChartController';
import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';

export const ssr = true;

export const component = () => {
  const { metricId, metricVersionNumber } = useGetMetricParams();
  return (
    <AppAssetCheckLayout assetType={'metric_file'}>
      <MetricViewChartController
        metricId={metricId}
        versionNumber={metricVersionNumber}
        className="h-full w-full"
        cardClassName="max-h-full!"
        readOnly
      />
    </AppAssetCheckLayout>
  );
};

export const head = ({ loaderData }: { loaderData?: { title: string | undefined } } = {}) => ({
  meta: [
    {
      title: loaderData?.title || 'Metric',
      description: 'This is a metric that was created by the good folks at Buster.so',
    },
  ],
});

export const loader = async ({
  params,
  context: { queryClient },
}: {
  params: { metricId: string };
  context: { queryClient: QueryClient };
}) => {
  const metric = await prefetchGetMetric(queryClient, { id: params.metricId });
  return {
    title: metric?.name,
  };
};

export const staticData = {
  assetType: 'metric_file' as AssetType,
};
