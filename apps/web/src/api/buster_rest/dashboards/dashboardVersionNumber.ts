import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useGetAssetVersionNumber } from '@/api/response-helpers/common-version-number';
import type { BusterDashboardResponse } from '../../asset_interfaces/dashboard/interfaces';
import { dashboardQueryKeys } from '../../query_keys/dashboard';

const stableVersionDataSelector = (data: BusterDashboardResponse) => data.dashboard.version_number;
const stableVersionSearchSelector = (state: { dashboard_version_number?: number | undefined }) =>
  state.dashboard_version_number;

export const useGetDashboardVersionNumber = (
  dashboardId: string,
  versionNumber: number | 'LATEST' | undefined
) => {
  return useGetAssetVersionNumber(
    dashboardQueryKeys.dashboardGetDashboard(dashboardId, 'LATEST'),
    versionNumber,
    stableVersionDataSelector,
    stableVersionSearchSelector
  );
};

export const useGetLatestDashboardVersionMemoized = () => {
  const queryClient = useQueryClient();

  return useCallback((dashboardId: string) => {
    const data = queryClient.getQueryData(
      dashboardQueryKeys.dashboardGetDashboard(dashboardId, 'LATEST').queryKey
    );
    return data?.dashboard.version_number;
  }, []);
};
