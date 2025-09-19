import type { QueryClient } from '@tanstack/react-query';
import { prefetchGetMetric } from '@/api/buster_rest/metrics';
import { useGetMetricParams } from '@/context/Metrics/useGetMetricParams';
import { MetricViewChartController } from '@/controllers/MetricController/MetricViewChartController';

export const ssr = true;

export const component = () => {
  const { metricId } = useGetMetricParams();
  return (
    <MetricViewChartController
      metricId={metricId}
      className="h-full w-full"
      cardClassName="max-h-full!"
      readOnly
    />
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
  params: { metricId: string; reportId?: string };
  context: { queryClient: QueryClient };
}) => {
  const metric = await prefetchGetMetric(queryClient, {
    id: params.metricId,
    report_file_id: params.reportId,
  });
  return {
    title: metric?.name,
  };
};
