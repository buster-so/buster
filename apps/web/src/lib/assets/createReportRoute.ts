import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';

export type ReportRouteParams = {
  assetId: string;
  chatId?: string;
  type: 'report';
  page?: 'report' | 'file' | undefined;
  secondaryView?: undefined;
  reportVersionNumber?: number;
};

export const createReportRoute = ({
  assetId: reportId,
  chatId,
  reportVersionNumber,
  page = 'report'
}: Omit<ReportRouteParams, 'type'>) => {
  // Handle file page routes with version numbers
  if (page === 'file') {
    if (chatId) {
      // Chat context file route
      return createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_REPORT_ID_FILE,
        chatId,
        reportId,
        reportVersionNumber
      });
    }

    // Standalone file route
    return createBusterRoute({
      route: BusterRoutes.APP_REPORTS_ID_FILE,
      reportId,
      reportVersionNumber
    });
  }

  // Handle standard report page routes
  if (chatId) {
    // Report routes within a chat context
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
