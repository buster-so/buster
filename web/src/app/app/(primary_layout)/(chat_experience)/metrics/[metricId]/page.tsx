import { MetricController } from '@controllers/MetricController';
import { AppAssetCheckLayout } from '@layouts/AppAssetCheckLayout';

export default async function MetricPage(
  props: {
    params: Promise<{ metricId: string }>;
    searchParams: Promise<{ embed?: string }>;
  }
) {
  const searchParams = await props.searchParams;

  const {
    embed
  } = searchParams;

  const params = await props.params;

  const {
    metricId
  } = params;

  const embedView = embed === 'true';

  return (
    <AppAssetCheckLayout metricId={metricId} type="metric">
      <MetricController metricId={metricId} />
    </AppAssetCheckLayout>
  );
}
