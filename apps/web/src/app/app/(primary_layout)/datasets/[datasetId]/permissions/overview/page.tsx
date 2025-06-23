import { PermissionOverview } from './_PermissionOverview';

export default async function Page(props: { params: Promise<{ datasetId: string }> }) {
  const params = await props.params;
  return <PermissionOverview datasetId={params.datasetId} />;
}
