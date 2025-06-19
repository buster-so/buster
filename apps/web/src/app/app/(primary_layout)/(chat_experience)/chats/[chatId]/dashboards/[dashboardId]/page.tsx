import { DashboardViewDashboardController } from '@/controllers/DashboardController/DashboardViewDashboardController';

export default async function Page(props: {
  params: Promise<{ dashboardId: string; chatId: string }>;
}) {
  const params = await props.params;

  const { dashboardId, chatId } = params;

  return <DashboardViewDashboardController dashboardId={dashboardId} chatId={chatId} />;
}
