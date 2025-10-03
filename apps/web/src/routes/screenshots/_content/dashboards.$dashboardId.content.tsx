import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetDashboard } from '@/api/buster_rest/dashboards';
import { GetDashboardScreenshotQuerySchema } from '../dashboard.$dashboardId.index';

export const Route = createFileRoute('/screenshots/_content/dashboards/$dashboardId/content')({
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

    return { dashboard };
  },
});

function RouteComponent() {
  return <div>Hello "/screenshots/_content/dashboards/$dashboardId/content"!</div>;
}
