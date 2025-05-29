import { queryOptions } from '@tanstack/react-query';
import type {
  BusterDashboardListItem,
  BusterDashboardResponse
} from '@/api/asset_interfaces/dashboard';
import type { dashboardsGetList } from '../buster_rest/dashboards';

const dashboardGetList = (
  filters?: Omit<Parameters<typeof dashboardsGetList>[0], 'page_token' | 'page_size'>
) =>
  queryOptions<BusterDashboardListItem[]>({
    queryKey: ['dashboard', 'list', filters || { page_token: 0, page_size: 3500 }] as const,
    staleTime: 0,
    initialData: [],
    initialDataUpdatedAt: 0
  });

const dashboardGetDashboard = (dashboardId: string, version_number: number | null) =>
  queryOptions<BusterDashboardResponse>({
    queryKey: ['dashboard', 'get', dashboardId, version_number || 'INITIAL'] as const,
    staleTime: 10 * 1000
  });

export const dashboardQueryKeys = {
  dashboardGetDashboard,
  dashboardGetList
};
