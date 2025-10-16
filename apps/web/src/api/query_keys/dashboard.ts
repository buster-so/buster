import type { GetDashboardResponse, GetDashboardsResponse } from '@buster/server-shared/dashboards';
import { queryOptions } from '@tanstack/react-query';
import type { dashboardsGetList } from '../buster_rest/dashboards';

const dashboardGetList = (
  filters?: Omit<Parameters<typeof dashboardsGetList>[0], 'page_token' | 'page_size'>
) =>
  queryOptions<GetDashboardsResponse>({
    queryKey: ['dashboard', 'list', filters || { page_token: 1, page_size: 3500 }] as const,
    staleTime: 3000, // 3 seconds
    initialDataUpdatedAt: 0,
    initialData: {
      data: [],
      pagination: {
        page_size: 3500,
        page: 1,
        total: 0,
        total_pages: 0,
      },
    },
  });

const dashboardGetDashboard = (dashboardId: string, version_number: number | 'LATEST') =>
  queryOptions<GetDashboardResponse>({
    queryKey: ['dashboard', 'get', dashboardId, version_number || 'LATEST'] as const,
    staleTime: 60 * 1000,
  });

export const dashboardQueryKeys = {
  dashboardGetDashboard,
  dashboardGetList,
};
