import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';

export default async function MetricLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ metricId: string }>;
}) {
  const { metricId } = await params;

  return (
    <AppAssetCheckLayout assetId={metricId} type="metric">
      {children}
    </AppAssetCheckLayout>
  );
}
