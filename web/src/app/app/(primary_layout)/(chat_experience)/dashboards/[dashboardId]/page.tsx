import { DashboardController } from '@controllers/DashboardController';
import { AppAssetCheckLayout } from '@layouts/AppAssetCheckLayout';

export default async function Page(props: { params: Promise<{ dashboardId: string }> }) {
  const params = await props.params;

  const {
    dashboardId
  } = params;

  return (
    <AppAssetCheckLayout dashboardId={dashboardId} type="dashboard">
      <DashboardController dashboardId={dashboardId} />
    </AppAssetCheckLayout>
  );
}
