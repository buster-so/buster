import type { GetDashboardResponse } from '@buster/server-shared/dashboards';
import { queryOptions } from '@tanstack/react-query';
import type { BusterDashboardListItem } from '@/api/asset_interfaces/dashboard';
import type { dashboardsGetList } from '../buster_rest/dashboards';

const dashboardGetList = (
  filters?: Omit<Parameters<typeof dashboardsGetList>[0], 'page_token' | 'page_size'>
) =>
  queryOptions<BusterDashboardListItem[]>({
    queryKey: ['dashboard', 'list', filters || { page_token: 0, page_size: 3500 }] as const,
    staleTime: 0,
    initialData: [],
    initialDataUpdatedAt: 0,
  });

const dashboardGetDashboard = (dashboardId: string, version_number: number | 'LATEST') =>
  queryOptions<GetDashboardResponse>({
    queryKey: ['dashboard', 'get', 'v2', dashboardId, version_number || 'LATEST'] as const, // Added 'v2' to bust cache
    staleTime: 0, // Temporarily set to 0 during filter development
  });

export const dashboardQueryKeys = {
  dashboardGetDashboard,
  dashboardGetList,
};
