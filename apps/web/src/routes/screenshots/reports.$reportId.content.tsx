import { GetReportScreenshotQuerySchema } from '@buster/server-shared/screenshots';
import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetReport } from '@/api/buster_rest/reports';

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
      throw new Error('Report not found');
    }

    return { report };
  },
});

function RouteComponent() {
  return <div>Hello "/screenshots/_content/reports/$reportId/conent"!</div>;
}
