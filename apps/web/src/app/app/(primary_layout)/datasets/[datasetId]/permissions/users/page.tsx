import { PermissionUsers } from '@/controllers/DatasetPermissionUser';

export default async function Page(props: { params: Promise<{ datasetId: string }> }) {
  const params = await props.params;
  return <PermissionUsers datasetId={params.datasetId} />;
}
