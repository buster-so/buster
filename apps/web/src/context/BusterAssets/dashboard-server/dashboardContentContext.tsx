import { useGetDashboardParams } from '@/context/Dashboards/useGetDashboardParams';
import { DashboardViewDashboardController } from '@/controllers/DashboardController/DashboardViewDashboardController';

export const component = () => {
  const { dashboardId, dashboardVersionNumber } = useGetDashboardParams();

  return (
    <DashboardViewDashboardController
      dashboardId={dashboardId}
      dashboardVersionNumber={dashboardVersionNumber}
    />
  );
};
