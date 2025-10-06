import { GetReportScreenshotQuerySchema } from '@buster/server-shared/screenshots';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { ensureMetricData } from '@/api/buster_rest/metrics';
import { prefetchGetReport } from '@/api/buster_rest/reports';
import { ReportPageController } from '@/controllers/ReportPageControllers';

export const Route = createFileRoute('/screenshots/reports/$reportId/content')({
  component: RouteComponent,
  validateSearch: GetReportScreenshotQuerySchema,
  ssr: true,
  beforeLoad: async ({ context, params, search }) => {
    const report = await prefetchGetReport(
      context.queryClient,
      params.reportId,
      search.version_number
    );

    if (!report) {
      throw redirect({
        to: '/app/home',
      });
    }

    const allMetrics = Object.entries(report?.metrics || {});

    await Promise.all(
      allMetrics.map(([metricId, metric]) => {
        return ensureMetricData(context.queryClient, {
          id: metricId,
          version_number: metric.version_number,
        });
      })
    );

    return { report };
  },
});

function RouteComponent() {
  const { reportId } = Route.useParams();
  return <ReportPageController reportId={reportId} readOnly mode="export" />;
}
