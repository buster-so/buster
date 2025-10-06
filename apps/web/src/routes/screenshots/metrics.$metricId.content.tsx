import { GetMetricScreenshotQuerySchema } from '@buster/server-shared/screenshots';
import { createFileRoute } from '@tanstack/react-router';
import { ensureMetricData, prefetchGetMetric } from '@/api/buster_rest/metrics';
import { useGetMetricParams } from '@/context/Metrics/useGetMetricParams';
import { MetricViewChartController } from '@/controllers/MetricController/MetricViewChartController';

export const Route = createFileRoute('/screenshots/metrics/$metricId/content')({
  validateSearch: GetMetricScreenshotQuerySchema,
  ssr: true,
  beforeLoad: async ({ context, params, search }) => {
    const [metric, metricData] = await Promise.all([
      prefetchGetMetric(context.queryClient, {
        id: params.metricId,
        version_number: search.version_number,
      }),
      ensureMetricData(context.queryClient, {
        id: params.metricId,
        version_number: search.version_number,
      }),
    ]);
    if (!metric || !metricData) {
      throw new Error('Metric not found');
    }
  },

  component: () => {
    const { metricId, metricVersionNumber } = useGetMetricParams();
    return (
      <MetricViewChartController
        metricId={metricId}
        versionNumber={metricVersionNumber}
        className="h-full w-full p-0 border-0!"
        cardClassName="max-h-full! border-0!"
        readOnly
        animate={false}
      />
    );
  },
});
