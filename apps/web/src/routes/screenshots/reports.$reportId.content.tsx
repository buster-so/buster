import { GetReportScreenshotQuerySchema } from '@buster/server-shared/screenshots';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { ensureMetricData } from '@/api/buster_rest/metrics';
import { prefetchGetReport } from '@/api/buster_rest/reports';
import { BusterChartDynamic } from '@/components/ui/charts/BusterChartDynamic';
import { ReportPageController } from '@/controllers/ReportPageControllers';

export const Route = createFileRoute('/screenshots/reports/$reportId/content')({
  component: RouteComponent,
  validateSearch: GetReportScreenshotQuerySchema,
  ssr: true,
  beforeLoad: ({ search }) => {
    return {
      version_number: search.version_number,
    };
  },
  loader: async ({ context, params }) => {
    const { version_number } = context;
    const [report] = await Promise.all([
      prefetchGetReport(context.queryClient, params.reportId, version_number),
    ]);
    if (!report) {
      throw redirect({
        to: '/app/home',
      });
    }

    const allMetrics = Object.entries(report?.metrics || {});

    const res = await Promise.all(
      allMetrics.map(([metricId, metric]) => {
        return ensureMetricData(context.queryClient, {
          id: metricId,
          version_number: metric.version_number,
          report_file_id: report.id,
        });
      })
    );

    const allMetricsLoaded = res.every((metric) => !!metric.metricId);

    if (!allMetricsLoaded) {
      throw new Error('Not all metrics loaded');
    }
  },
});

function RouteComponent() {
  const { reportId } = Route.useParams();
  return <ReportPageController reportId={reportId} readOnly mode="export" />;
}
