import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from 'mutative';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { setOriginalDashboard } from '@/context/Dashboards/useOriginalDashboardStore';
import { dashboardsCreateDashboard, dashboardsDeleteDashboard } from '../requests';

/**
 * useCreateDashboard
 * Creates a dashboard and seeds caches.
 */
export const useCreateDashboard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardsCreateDashboard,
    onSuccess: (originalData, variables) => {
      const data = create(originalData, (draft) => {
        draft.dashboard.name = variables.name || originalData.dashboard.name;
      });
      queryClient.setQueryData(
        dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, data.dashboard.version_number)
          .queryKey,
        data
      );
      queryClient.setQueryData(
        dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, 'LATEST').queryKey,
        data
      );
      setOriginalDashboard(data.dashboard);
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.dashboardGetList().queryKey,
          refetchType: 'all',
        });
      }, 550);
    },
  });
};

/**
 * useDeleteDashboards
 * Deletes one or more dashboards with optional confirmation.
 */
export const useDeleteDashboards = () => {
  const queryClient = useQueryClient();
  const { openConfirmModal } = useBusterNotifications();

  const onDeleteDashboard = async ({
    dashboardId,
    ignoreConfirm,
  }: {
    dashboardId: string | string[];
    ignoreConfirm?: boolean;
  }) => {
    const onMutate = () => {
      const queryKey = dashboardQueryKeys.dashboardGetList().queryKey;
      queryClient.setQueryData(queryKey, (v) => {
        if (!v) return v;
        const ids = typeof dashboardId === 'string' ? [dashboardId] : dashboardId;
        return {
          ...v,
          data: v.data.filter((t) => !ids.includes(t.id)),
        };
      });
    };

    const method = async () => {
      const ids = typeof dashboardId === 'string' ? [dashboardId] : dashboardId;
      onMutate();
      await dashboardsDeleteDashboard({ ids });
    };
    if (ignoreConfirm) {
      return method();
    }
    return await openConfirmModal({
      title: 'Delete Dashboard',
      content: 'Are you sure you want to delete this dashboard?',
      primaryButtonProps: {
        text: 'Delete',
      },
      onOk: method,
    });
  };

  return useMutation({
    mutationFn: onDeleteDashboard,
    onSuccess: (_, { dashboardId }) => {
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.dashboardGetList().queryKey,
        refetchType: 'all',
      });

      const ids = typeof dashboardId === 'string' ? [dashboardId] : dashboardId;
      ids.forEach((id) => {
        queryClient.removeQueries({
          exact: false,
          queryKey: dashboardQueryKeys.dashboardGetDashboard(id, 'LATEST').queryKey.slice(0, 3),
        });
      });
    },
  });
};
