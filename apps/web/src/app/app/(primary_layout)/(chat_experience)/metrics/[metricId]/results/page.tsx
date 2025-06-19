import { MetricViewResultsController } from '@/controllers/MetricController/MetricViewResults';

export default async function ResultsPage({ params }: { params: Promise<{ metricId: string }> }) {
  const { metricId } = await params;

  return <MetricViewResultsController metricId={metricId} />;
}
