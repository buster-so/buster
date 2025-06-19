import { MetricViewChart } from '@/controllers/MetricController/MetricViewChart';

export default async function ChartPage({ params }: { params: Promise<{ metricId: string }> }) {
  const { metricId } = await params;

  return <MetricViewChart metricId={metricId} />;
}
