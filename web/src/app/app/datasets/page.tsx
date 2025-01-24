import { prefetchGetDatasets } from '@/api/buster_rest/datasets';
import { DatasetsPageContent } from './DatasetsPageContent';

export default async function DashboardPage() {
  await prefetchGetDatasets();

  return <DatasetsPageContent />;
}
