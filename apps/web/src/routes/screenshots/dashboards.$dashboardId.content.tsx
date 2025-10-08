import { GetDashboardScreenshotQuerySchema } from '@buster/server-shared/screenshots';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { prefetchGetDashboard } from '@/api/buster_rest/dashboards';
import { ensureMetricData } from '@/api/buster_rest/metrics';
import { useGetDashboardParams } from '@/context/Dashboards/useGetDashboardParams';
import { DashboardViewDashboardController } from '@/controllers/DashboardController/DashboardViewDashboardController';

export const Route = createFileRoute('/screenshots/dashboards/$dashboardId/content')({
  component: RouteComponent,
  ssr: true,
  validateSearch: GetDashboardScreenshotQuerySchema,
  beforeLoad: ({ search }) => {
    return {
      version_number: search.version_number,
    };
  },
  loader: async ({ context, params }) => {
    const { version_number } = context;
    const dashboard = await prefetchGetDashboard({
      queryClient: context.queryClient,
      id: params.dashboardId,
      version_number: version_number,
    });

    if (!dashboard) {
      throw redirect({
        to: '/app/home',
      });
    }

    const numberOfMetrics = 8;
    const allMetrics = Object.entries(dashboard?.metrics || {});
    const firstXMetrics = allMetrics.slice(0, numberOfMetrics);
    const restMetrics = allMetrics.slice(numberOfMetrics);

    Promise.all(
      restMetrics.map(([metricId, metric]) => {
        return ensureMetricData(context.queryClient, {
          id: metricId,
          version_number: metric.version_number,
        });
      })
    );

    //Only really need to wait for the first X metrics to be loaded
    await Promise.all(
      firstXMetrics.map(([metricId, metric]) => {
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
    <DashboardViewDashboardController
      dashboardId={dashboardId}
      dashboardVersionNumber={dashboardVersionNumber}
      readOnly
      animate={false}
    />
  );
}
