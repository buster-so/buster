import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetDashboard } from '@/api/buster_rest/dashboards';
import { useGetDashboardParams } from '@/context/Dashboards/useGetDashboardParams';
import { DashboardViewDashboardController } from '@/controllers/DashboardController/DashboardViewDashboardController';

export const Route = createFileRoute('/embed/dashboard/$dashboardId')({
  loader: async ({ params, context: { queryClient } }) => {
    const dashboard = await prefetchGetDashboard({
      queryClient,
      id: params.dashboardId,
      prefetchMetricsData: false,
      shouldInitializeMetrics: true,
    });
    return {
      title: dashboard?.dashboard?.name,
    };
  },
  head: ({ loaderData }) => {
    return {
      meta: [
        { title: loaderData?.title || 'Dashboard' },
        { description: 'This is a dashboard that was created by the good folks at Buster.so' },
      ],
    };
  },
  component: RouteComponent,
  staticData: {
    assetType: 'dashboard_file',
  },
  ssr: true,
});

function RouteComponent() {
  const { dashboardId, dashboardVersionNumber } = useGetDashboardParams();

  return (
    <DashboardViewDashboardController
      dashboardId={dashboardId}
      dashboardVersionNumber={dashboardVersionNumber}
      readOnly
    />
  );
}
