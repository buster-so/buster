import { AppAssetCheckLayout } from '@layouts/AppAssetCheckLayout';

export default async function DashboardPage(
  props: {
    params: Promise<{ dashboardId: string }>;
  }
) {
  const params = await props.params;

  const {
    dashboardId
  } = params;

  return (
    <AppAssetCheckLayout dashboardId={dashboardId} type="dashboard">
      <></>
    </AppAssetCheckLayout>
  );
}
