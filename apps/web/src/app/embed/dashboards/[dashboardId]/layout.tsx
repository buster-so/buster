import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';

export default async function EmbedMetricsLayout({
  children,
  params: { dashboardId }
}: {
  children: React.ReactNode;
  params: { dashboardId: string };
}) {
  return (
    <AppAssetCheckLayout assetId={dashboardId} type="dashboard">
      {children}
    </AppAssetCheckLayout>
  );
}
