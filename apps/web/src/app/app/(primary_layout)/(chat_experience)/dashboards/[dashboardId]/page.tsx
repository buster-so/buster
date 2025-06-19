import { DashboardViewDashboardController } from '@/controllers/DashboardController/DashboardViewDashboardController';

export default async function Page(props: { params: Promise<{ dashboardId: string }> }) {
  const params = await props.params;

  const { dashboardId } = params;

  return <DashboardViewDashboardController dashboardId={dashboardId} chatId={undefined} />;
}
