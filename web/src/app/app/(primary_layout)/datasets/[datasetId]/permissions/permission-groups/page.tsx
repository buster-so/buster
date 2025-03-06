import { PermissionPermissionGroup } from './_PermissionPermissionGroup';

export default async function Page(props: { params: Promise<{ datasetId: string }> }) {
  const params = await props.params;
  return <PermissionPermissionGroup datasetId={params.datasetId} />;
}
