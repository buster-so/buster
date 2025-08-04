import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';
import type { Metadata } from 'next';
import { getTitle_server } from '@/api/buster_rest/title';

export default async function ReportLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;

  return (
    <AppAssetCheckLayout assetId={reportId} type="report">
      {children}
    </AppAssetCheckLayout>
  );
}

// Generate metadata dynamically based on the report - shared across all child pages
export async function generateMetadata({
  params
}: {
  params: Promise<{ reportId: string }>;
}): Promise<Metadata> {
  const { reportId } = await params;

  try {
    // Fetch the report title using the server-side request
    const response = await getTitle_server({
      assetId: reportId,
      assetType: 'report'
    });

    return {
      title: response.title || 'New Report'
    };
  } catch (error) {
    // Fallback title if the request fails
    console.error('Failed to fetch report title:', error);
    return {
      title: 'New Report'
    };
  }
}
