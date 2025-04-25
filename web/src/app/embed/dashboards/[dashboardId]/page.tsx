import { DashboardViewDashboardController } from '@/controllers/DashboardController/DashboardViewDashboardController';

export default async function EmbedDashboardsPage(props: { params: Promise<{ dashboardId: string }> }) {
  const { dashboardId } = (await props.params);

  return (
    <DashboardViewDashboardController
      dashboardId={dashboardId}
      readOnly={true}
      chatId={undefined}
    />
  );
}
