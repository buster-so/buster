import { MetricViewChart } from '@/controllers/MetricController/MetricViewChart/MetricViewChart';

export default async function EmbedMetricsPage(props: { params: Promise<{ metricId: string }> }) {
  const params = await props.params;
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
