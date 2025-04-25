import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';

export default async function EmbedMetricsLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{ dashboardId: string }>;
  }
) {
  const params = await props.params;

  const {
    dashboardId
  } = params;

  const {
    children
  } = props;

  return (
    <AppAssetCheckLayout assetId={dashboardId} type="dashboard">
      {children}
    </AppAssetCheckLayout>
  );
}
