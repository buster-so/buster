import { MetricController } from '@controllers/MetricController';
import { AppAssetCheckLayout } from '@layouts/AppAssetCheckLayout';

export default async function Page(
  props: {
    params: Promise<{ chatId: string; metricId: string }>;
  }
) {
  const params = await props.params;

  const {
    chatId,
    metricId
  } = params;

  return (
    <AppAssetCheckLayout metricId={metricId} type="metric">
      <MetricController metricId={metricId} />
    </AppAssetCheckLayout>
  );
}
