import { MetricViewFile } from '@/controllers/MetricController/MetricViewFile';

export default async function FilePage({ params }: { params: Promise<{ metricId: string }> }) {
  const { metricId } = await params;

  return <MetricViewFile metricId={metricId} />;
}
