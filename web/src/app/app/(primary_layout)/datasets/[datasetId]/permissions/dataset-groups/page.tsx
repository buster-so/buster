import { PermissionDatasetGroups } from './_PermissionDatasetGroups';

export default async function Page(props: { params: Promise<{ datasetId: string }> }) {
  const params = await props.params;
  return <PermissionDatasetGroups datasetId={params.datasetId} />;
}
