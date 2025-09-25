import { useQueryClient } from '@tanstack/react-query';
import last from 'lodash/last';
import { create } from 'mutative';
import { useCallback, useMemo } from 'react';
import type { BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { compareObjectsByKeys } from '@/lib/objects';
import { canEdit } from '@/lib/share';
import { useGetOriginalDashboard } from './useOriginalDashboardStore';

export const useIsDashboardChanged = ({
  dashboardId = '',
  enabled = true,
}: {
  dashboardId: string | undefined;
  enabled?: boolean;
}) => {
  const queryClient = useQueryClient();
  const originalDashboard = useGetOriginalDashboard(dashboardId);

  const { data: currentDashboard, refetch: refetchCurrentDashboard } = useGetDashboard(
    { id: dashboardId, versionNumber: undefined },
    {
      select: useCallback(
        (x: BusterDashboardResponse) => ({
          name: x.dashboard.name,
          description: x.dashboard.description,
          config: x.dashboard.config,
          file: x.dashboard.file,
          permission: x.permission,
          versions: x.versions,
          version_number: x.dashboard.version_number,
        }),
        []
      ),
      enabled: false,
    }
  );

  const isLatestVersion =
    currentDashboard?.version_number === last(currentDashboard?.versions)?.version_number;

  const onResetToOriginal = useMemoizedFn(() => {
    const options = dashboardQueryKeys.dashboardGetDashboard(dashboardId, 'LATEST');
    const currentDashboard = queryClient.getQueryData<BusterDashboardResponse>(options.queryKey);
    if (originalDashboard && currentDashboard) {
      const resetDashboard = create(currentDashboard, (draft) => {
        Object.assign(draft, originalDashboard);
      });
      queryClient.setQueryData(options.queryKey, resetDashboard);
    }
    refetchCurrentDashboard();
  });

  const isEditor = canEdit(currentDashboard?.permission);

  const isFileChanged = useMemo(() => {
    if (!isEditor || !isLatestVersion || !currentDashboard || !originalDashboard || !enabled)
      return false;
    return (
      !originalDashboard ||
      !currentDashboard ||
      !compareObjectsByKeys(originalDashboard, currentDashboard, [
        'name',
        'description',
        'config',
        'file',
      ])
    );
  }, [originalDashboard, isEditor, currentDashboard, isLatestVersion, enabled]);

  return useMemo(() => ({ onResetToOriginal, isFileChanged }), [onResetToOriginal, isFileChanged]);
};
