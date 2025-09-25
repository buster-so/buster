import React, { useCallback } from 'react';
import type { BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import { useGetDashboard, useUpdateDashboard } from '@/api/buster_rest/dashboards';
import { SaveResetFilePopup } from '@/components/features/popups/SaveResetFilePopup';
import { useGetChatId } from '@/context/Chats/useGetChatId';
import { useIsDashboardFileChanged } from '@/context/Dashboards/useIsDashboardFileChanged';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

export const DashboardSaveFilePopup: React.FC<{ dashboardId: string }> = React.memo(
  ({ dashboardId }) => {
    const { isFileChanged, onResetToOriginal } = useIsDashboardFileChanged({ dashboardId });
    const chatId = useGetChatId();
    // const chatId = useChatLayoutContextSelector((x) => x.chatId);
    const { data: dashboard } = useGetDashboard(
      { id: dashboardId, versionNumber: 'LATEST' },
      {
        select: useCallback(
          (x: BusterDashboardResponse) => ({
            name: x?.dashboard?.name,
            description: x?.dashboard?.description,
            config: x?.dashboard?.config,
          }),
          []
        ),
      }
    );
    const { mutateAsync: onSaveDashboard, isPending: isSaving } = useUpdateDashboard({
      saveToServer: true,
      updateOnSave: true,
      updateVersion: !chatId,
    });

    const onSaveDashboardFileToServer = useMemoizedFn(() => {
      onSaveDashboard({
        id: dashboardId,
        name: dashboard?.name,
        description: dashboard?.description,
        config: dashboard?.config,
      });
    });

    return (
      <SaveResetFilePopup
        open={isFileChanged}
        onReset={onResetToOriginal}
        onSave={onSaveDashboardFileToServer}
        isSaving={isSaving}
        showHotsKeys={false}
      />
    );
  }
);

DashboardSaveFilePopup.displayName = 'DashboardSaveFilePopup';
