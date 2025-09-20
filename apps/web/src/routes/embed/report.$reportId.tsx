import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { prefetchGetReport } from '@/api/buster_rest/reports/queryRequests';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ReportPageController } from '@/controllers/ReportPageControllers';

const searchParamsSchema = z.object({
  report_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/embed/report/$reportId')({
  component: RouteComponent,
  validateSearch: searchParamsSchema,
  beforeLoad: ({ search }) => {
    return {
      report_version_number: search.report_version_number,
    };
  },
  loader: async ({ params, context: { report_version_number, queryClient } }) => {
    const report = await prefetchGetReport(queryClient, params.reportId, report_version_number);
    return {
      title: report?.name,
    };
  },
  head: ({ loaderData }) => {
    return {
      meta: [
        { title: loaderData?.title || 'Report' },
        { description: 'This is a report that was created by the good folks at Buster.so' },
      ],
    };
  },
});

function RouteComponent() {
  const { reportId } = Route.useParams();
  return (
    <ScrollArea className="min-h-screen bg-page-background">
      <ReportPageController reportId={reportId} readOnly />
    </ScrollArea>
  );
}
