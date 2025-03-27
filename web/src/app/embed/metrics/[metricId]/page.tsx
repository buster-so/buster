'use client';

import { useGetMetric } from '@/api/buster_rest/metrics';
import { CircleSpinnerLoaderContainer } from '@/components/ui/loaders';
import { MetricViewChart } from '@/controllers/MetricController/MetricViewChart/MetricViewChart';

export default function EmbedMetricsPage({
  params,
  searchParams
}: {
  params: { metricId: string };
  searchParams: { version_number?: string };
}) {
  const { metricId } = params;
  const { version_number } = searchParams;
  const { isFetched, error } = useGetMetric({
    id: metricId,
    version_number: version_number ? parseInt(version_number) : undefined
  });

  if (!isFetched) {
    return <CircleSpinnerLoaderContainer className="min-h-screen" />;
  }

  return <MetricViewChart metricId={metricId} readOnly={true} cardClassName="max-h-screen!" />;
}
