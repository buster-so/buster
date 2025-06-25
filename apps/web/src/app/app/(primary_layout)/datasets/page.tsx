import { DatasetsListController } from '../../../../controllers/DatasetsListController';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datasets'
};

export default async function DashboardPage() {
  return <DatasetsListController />;
}
