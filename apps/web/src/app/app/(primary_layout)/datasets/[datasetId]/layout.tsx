import type React from 'react';
import { AppPageLayout } from '@/components/ui/layouts';
import { DatasetPageProvider } from './_DatasetsLayout/DatasetPageContext';
import { DatasetsIndividualHeader } from './_DatasetsLayout/DatasetsIndividualHeader';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datasets'
};

export default async function Layout({
  children,
  params
}: {
  params: Promise<{ datasetId: string }>;
  children: React.ReactNode;
}) {
  const { datasetId } = await params;

  return (
    <DatasetPageProvider datasetId={datasetId}>
      <AppPageLayout header={<DatasetsIndividualHeader />}>{children}</AppPageLayout>
    </DatasetPageProvider>
  );
}
