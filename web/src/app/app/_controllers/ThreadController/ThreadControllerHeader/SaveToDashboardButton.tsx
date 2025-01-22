import { BusterDashboardListItem } from '@/api/buster_rest';
import { AppMaterialIcons, AppTooltip } from '@/components';
import { AppDropdownSelect } from '@/components/dropdown';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useDashboardContextSelector } from '@/context/Dashboards';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { IBusterThread } from '@/context/Threads/interfaces';
import { BusterRootRoutes, BusterRoutes, createBusterRoute } from '@/routes';
import { useMemoizedFn, useMount, useUnmount } from 'ahooks';
import { Button } from 'antd';
import React, { useEffect, useMemo } from 'react';

export const SaveToDashboardButton: React.FC<{
  threadId: string;
  selectedDashboards: IBusterThread['dashboards'];
  disabled?: boolean;
}> = React.memo(({ threadId, selectedDashboards, disabled }) => {
  const saveThreadToDashboard = useBusterThreadsContextSelector(
    (state) => state.saveThreadToDashboard
  );
  const removeThreadFromDashboard = useBusterThreadsContextSelector(
    (state) => state.removeThreadFromDashboard
  );
  const initDashboardsList = useDashboardContextSelector((state) => state.initDashboardsList);
  const unsubscribeFromDashboardsList = useDashboardContextSelector(
    (state) => state.unsubscribeFromDashboardsList
  );

  const onSaveToDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
    await saveThreadToDashboard({ threadId, dashboardIds });
  });

  const onRemoveFromDashboard = useMemoizedFn(async (dashboardId: string) => {
    return await removeThreadFromDashboard({ threadId, dashboardId, useConfirmModal: false });
  });

  const onClick = useMemoizedFn(() => {
    initDashboardsList();
  });

  useMount(() => {
    setTimeout(() => {
      initDashboardsList();
    }, 8000);
  });

  useUnmount(() => {
    unsubscribeFromDashboardsList();
  });

  return (
    <SaveToDashboardDropdown
      threadId={threadId}
      selectedDashboards={selectedDashboards}
      onSaveToDashboard={onSaveToDashboard}
      onRemoveFromDashboard={onRemoveFromDashboard}>
      <Button
        type="text"
        disabled={disabled}
        icon={<AppMaterialIcons icon="dashboard_customize" />}
        onClick={onClick}
      />
    </SaveToDashboardDropdown>
  );
});
SaveToDashboardButton.displayName = 'SaveToDashboardButton';

export const SaveToDashboardDropdown: React.FC<{
  children: React.ReactNode;
  selectedDashboards: IBusterThread['dashboards'];
  onSaveToDashboard: (dashboardId: string[]) => Promise<void>;
  onRemoveFromDashboard: (dashboardId: string) => void;
  threadId: string;
}> = ({ threadId, children, onRemoveFromDashboard, onSaveToDashboard, selectedDashboards }) => {
  const onCreateNewDashboard = useDashboardContextSelector((x) => x.onCreateNewDashboard);
  const creatingDashboard = useDashboardContextSelector((x) => x.creatingDashboard);
  const initDashboardsList = useDashboardContextSelector((x) => x.initDashboardsList);
  const dashboardsList = useDashboardContextSelector((state) => state.dashboardsList);
  const saveThreadToDashboard = useBusterThreadsContextSelector(
    (state) => state.saveThreadToDashboard
  );
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);

  const [showDropdown, setShowDropdown] = React.useState(false);

  const onClickItem = useMemoizedFn(async (dashboard: BusterDashboardListItem) => {
    const isSelected = selectedDashboards.some((d) => d.id === dashboard.id);
    if (isSelected) {
      onRemoveFromDashboard(dashboard.id);
    } else {
      const allDashboardsAndSelected = selectedDashboards.map((d) => d.id).concat(dashboard.id);
      await onSaveToDashboard(allDashboardsAndSelected);
    }
  });

  const items = useMemo(
    () =>
      dashboardsList.map((dashboard) => {
        return {
          key: dashboard.id,
          label: dashboard.name || 'New dashboard',
          onClick: () => onClickItem(dashboard),
          link: createBusterRoute({
            route: BusterRoutes.APP_DASHBOARD_ID,
            dashboardId: dashboard.id
          })
        };
      }),
    [dashboardsList]
  );

  const selectedItems = useMemo(() => {
    return selectedDashboards.map((d) => d.id);
  }, [selectedDashboards]);

  const onClickNewDashboardButton = useMemoizedFn(async () => {
    const res = await onCreateNewDashboard({
      rerouteToDashboard: false
    });

    if (threadId && res?.id) {
      await saveThreadToDashboard({
        threadId,
        dashboardIds: [res.id]
      });
    }

    if (res?.id) {
      onChangePage({
        route: BusterRoutes.APP_DASHBOARD_ID,
        dashboardId: res.id
      });
    }

    setShowDropdown(false);
  });

  const onOpenChange = useMemoizedFn((open: boolean) => {
    setShowDropdown(open);
  });

  useEffect(() => {
    if (showDropdown) {
      initDashboardsList();
    }
  }, [showDropdown]);

  return (
    <>
      <AppDropdownSelect
        trigger={['click']}
        headerContent={'Save to a dashboard'}
        placement="bottomRight"
        open={showDropdown}
        onOpenChange={onOpenChange}
        footerContent={
          <Button
            type="text"
            className="!justify-start"
            loading={creatingDashboard}
            block
            icon={<AppMaterialIcons icon="add" />}
            onClick={onClickNewDashboardButton}>
            New dashboard
          </Button>
        }
        items={items}
        selectedItems={selectedItems}>
        <AppTooltip title={showDropdown ? '' : 'Save to dashboard'}>{children}</AppTooltip>
      </AppDropdownSelect>
    </>
  );
};
