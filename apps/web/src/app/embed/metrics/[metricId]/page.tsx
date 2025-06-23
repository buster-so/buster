import { MetricViewChart } from '@/controllers/MetricController/MetricViewChart/MetricViewChart';

export default function EmbedMetricsPage({ params }: { params: { metricId: string } }) {
  const { metricId } = params;

  return (
    <div className="flex h-screen w-full">
      <MetricViewChart
        metricId={metricId}
        readOnly={true}
        className="h-full w-full"
        cardClassName="max-h-full!"
      />
    </div>
  );
}
