import { GetDashboardScreenshotQuerySchema } from '@buster/server-shared/screenshots';
import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetDashboard } from '@/api/buster_rest/dashboards';
import { ensureMetricData } from '@/api/buster_rest/metrics';
import { useGetDashboardParams } from '@/context/Dashboards/useGetDashboardParams';
import { DashboardViewDashboardController } from '@/controllers/DashboardController/DashboardViewDashboardController';

export const Route = createFileRoute('/screenshots/dashboards/$dashboardId/content')({
  component: RouteComponent,
  ssr: true,
  validateSearch: GetDashboardScreenshotQuerySchema,
  beforeLoad: async ({ context, params, search }) => {
    const dashboard = await prefetchGetDashboard({
      queryClient: context.queryClient,
      id: params.dashboardId,
      version_number: search.version_number,
    });

    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    const allMetrics = Object.entries(dashboard?.metrics || {});

    await Promise.all(
      allMetrics.map(([metricId, metric]) => {
        return ensureMetricData(context.queryClient, {
          id: metricId,
          version_number: metric.version_number,
        });
      })
    );

    return { dashboard };
  },
});

function RouteComponent() {
  const { dashboardId, dashboardVersionNumber } = useGetDashboardParams();
  return (
    <div className="h-full w-full bg-page-background overflow-y-auto">
      <DashboardViewDashboardController
        dashboardId={dashboardId}
        dashboardVersionNumber={dashboardVersionNumber}
        readOnly
        animate={false}
      />
    </div>
  );
}
