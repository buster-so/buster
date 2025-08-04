import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';

export type ReportRouteParams = {
  assetId: string;
  chatId?: string;
  type: 'report';
};

export const createReportRoute = ({
  assetId: reportId,
  chatId
}: Omit<ReportRouteParams, 'type'>) => {
  // Report routes within a chat context
  if (chatId) {
    return createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_REPORT_ID,
      chatId,
      reportId
    });
  }

  // Standalone report route
  return createBusterRoute({
    route: BusterRoutes.APP_REPORTS_ID,
    reportId
  });
};
