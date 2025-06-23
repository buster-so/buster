'use client';

import React, { useEffect, useMemo } from 'react';
import { useCreateDashboard, useUpdateDashboard } from '@/api/buster_rest/dashboards';
import { Input } from '@/components/ui/inputs';
import { AppModal } from '@/components/ui/modal';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { inputHasText } from '@/lib/text';
import { BusterRoutes } from '@/routes';

export const NewDashboardModal: React.FC<{
  open: boolean;
  onClose: () => void;
  useChangePage?: boolean;
  onDashboardCreated?: (dashboardId: string) => void;
}> = React.memo(({ onClose, open, useChangePage = true, onDashboardCreated }) => {
  const [title, setTitle] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { mutateAsync: createNewDashboard, isPending: isCreatingDashboard } = useCreateDashboard();
  const { mutateAsync: updateDashboard, isPending: isUpdatingDashboard } = useUpdateDashboard({
    updateOnSave: false,
    updateVersion: false,
    saveToServer: true
  });

  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);

  const disableSubmit = !inputHasText(title);

  const memoizedHeader = useMemo(() => {
    return {
      title: 'New dashboard',
      description: 'Once created, you will be able to add metrics and charts to the dashboard'
    };
  }, []);

  const onCreateNewDashboard = useMemoizedFn(async () => {
    if (isCreatingDashboard || disableSubmit) return;
    const res = await createNewDashboard({ name: title, description: '' });
    const newDashboardId = res.dashboard.id;

    if (newDashboardId) {
      await updateDashboard({ id: newDashboardId, name: title });
    }

    if (onDashboardCreated && newDashboardId) {
      onDashboardCreated(newDashboardId);
    }
    if (useChangePage && res) {
      onChangePage({
        route: BusterRoutes.APP_DASHBOARD_ID,
        dashboardId: newDashboardId
      });
    }
    setTimeout(() => {
      onClose();
    }, 200);
  });

  const memoizedFooter = useMemo(() => {
    return {
      primaryButton: {
        text: 'Create dashboard',
        onClick: onCreateNewDashboard,
        loading: isCreatingDashboard || isUpdatingDashboard,
        disabled: disableSubmit
      }
    };
  }, [isCreatingDashboard, isUpdatingDashboard, disableSubmit]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [open]);

  return (
    <AppModal open={open} onClose={onClose} header={memoizedHeader} footer={memoizedFooter}>
      <Input
        ref={inputRef}
        placeholder="Dashboard title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onPressEnter={onCreateNewDashboard}
      />
    </AppModal>
  );
});
NewDashboardModal.displayName = 'NewDashboardModal';
