import { DashboardViewDashboardController } from '@/controllers/DashboardController/DashboardViewDashboardController';

export default function EmbedDashboardsPage(props: { params: { dashboardId: string } }) {
  const { dashboardId } = props.params;

  return (
    <DashboardViewDashboardController
      dashboardId={dashboardId}
      readOnly={true}
      chatId={undefined}
    />
  );
}
