import { MetricViewSQLController } from '@/controllers/MetricController/MetricViewSQL';

export default async function ResultsPage({ params }: { params: Promise<{ metricId: string }> }) {
  const { metricId } = await params;

  return <MetricViewSQLController metricId={metricId} />;
}
