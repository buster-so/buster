import { queryOptions } from '@tanstack/react-query';
import type {
  GetReportsListResponse,
  GetReportIndividualResponse,
  GetReportsListRequest
} from '@buster/server-shared/reports';

const reportsGetList = (filters?: GetReportsListRequest) =>
  queryOptions<GetReportsListResponse>({
    queryKey: ['reports', 'list', filters || { page: 1, page_size: 5000 }] as const,
    staleTime: 10 * 1000, // 10 seconds
    initialData: { data: [], pagination: { page: 1, page_size: 5000, total: 0, total_pages: 0 } },
    initialDataUpdatedAt: 0
  });

const reportsGetReport = (reportId: string, versionNumber?: number | null) =>
  queryOptions<GetReportIndividualResponse>({
    queryKey: ['reports', 'get', reportId, versionNumber || 'INITIAL'] as const,
    staleTime: 60 * 1000 // 60 seconds
  });

export const reportsQueryKeys = {
  reportsGetList,
  reportsGetReport
};
