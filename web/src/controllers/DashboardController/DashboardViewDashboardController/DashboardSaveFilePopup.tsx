import { useGetDashboard, useUpdateDashboard } from '@/api/buster_rest/dashboards';
import { SaveResetFilePopup } from '@/components/features/popups/SaveResetFilePopup';
import { useMemoizedFn } from '@/hooks';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';
import React from 'react';

export const DashboardSaveFilePopup: React.FC<{ dashboardId: string }> = React.memo(
  ({ dashboardId }) => {
    const onResetToOriginal = useChatIndividualContextSelector((x) => x.onResetToOriginal);
    const isFileChanged = useChatIndividualContextSelector((x) => x.isFileChanged);
    const chatId = useChatLayoutContextSelector((x) => x.chatId);
    const { data: dashboardResponse } = useGetDashboard({ id: dashboardId });
    const { mutateAsync: onSaveDashboard, isPending: isSaving } = useUpdateDashboard({
      saveToServer: true,
      updateOnSave: true,
      updateVersion: !chatId
    });

    const onSaveDashboardFileToServer = useMemoizedFn(() => {
      const dashboard = dashboardResponse?.dashboard;
      onSaveDashboard({
        id: dashboardId,
        name: dashboard?.name,
        description: dashboard?.description,
        config: dashboard?.config
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
