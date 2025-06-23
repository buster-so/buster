import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';

export default async function MetricLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ metricId: string; versionNumber?: number }>;
}) {
  const { metricId, versionNumber } = await params;

  return (
    <AppAssetCheckLayout assetId={metricId} type="metric" versionNumber={versionNumber}>
      {children}
    </AppAssetCheckLayout>
  );
}
