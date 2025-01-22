'use client';

import React, { useMemo, useState } from 'react';
import { AppContent } from '../_components/AppContent';
import { useDashboardContextSelector } from '@/context/Dashboards';
import { BusterUserAvatar } from '@/components';
import { formatDate } from '@/utils';
import { BusterList, BusterListColumn, BusterListRow } from '@/components/list';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { getShareStatus } from '../_components/Lists';
import { ListEmptyStateWithButton } from '../../../components/list';
import { useMemoizedFn, useUnmount } from 'ahooks';
import { DashboardSelectedOptionPopup } from './_DashboardSelectedPopup';

const columns: BusterListColumn[] = [
  {
    dataIndex: 'name',
    title: 'Title',
    render: (data) => {
      if (data) return data;
      return 'New Dashboard';
    }
  },
  {
    dataIndex: 'last_edited',
    title: 'Last edited',
    width: 120,
    render: (data) => formatDate({ date: data, format: 'lll' })
  },
  {
    dataIndex: 'created_at',
    title: 'Created at',
    width: 120,
    render: (data) => formatDate({ date: data, format: 'lll' })
  },
  {
    dataIndex: 'sharing',
    title: 'Sharing',
    width: 65,
    render: (_, data) => getShareStatus(data)
  },
  {
    dataIndex: 'owner',
    title: 'Owner',
    width: 55,
    render: (_, data) => {
      return <BusterUserAvatar image={data?.avatar_url} name={data?.name} size={18} />;
    }
  }
];

export const DashboardListContent: React.FC<{}> = () => {
  const dashboardsList = useDashboardContextSelector((state) => state.dashboardsList);
  const loadedDashboards = useDashboardContextSelector((state) => state.loadedDashboards);
  const unsubscribeFromDashboardsList = useDashboardContextSelector(
    (state) => state.unsubscribeFromDashboardsList
  );
  const onCreateNewDashboard = useDashboardContextSelector((state) => state.onCreateNewDashboard);
  const creatingDashboard = useDashboardContextSelector((state) => state.creatingDashboard);
  const [selectedDashboardIds, setSelectedDashboardIds] = useState<string[]>([]);

  const rows: BusterListRow[] = useMemo(() => {
    return dashboardsList.map((dashboard) => {
      return {
        id: dashboard.id,
        data: dashboard,
        link: createBusterRoute({
          route: BusterRoutes.APP_DASHBOARD_ID,
          dashboardId: dashboard.id
        })
      };
    });
  }, [dashboardsList]);

  const onClickEmptyState = useMemoizedFn(async () => {
    await onCreateNewDashboard({ rerouteToDashboard: true });
  });

  useUnmount(() => {
    unsubscribeFromDashboardsList();
  });

  return (
    <>
      <AppContent>
        <div className="relative flex h-full flex-col items-center">
          <BusterList
            rows={rows}
            columns={columns}
            selectedRowKeys={selectedDashboardIds}
            onSelectChange={setSelectedDashboardIds}
            emptyState={
              loadedDashboards ? (
                <ListEmptyStateWithButton
                  title={`You don’t have any dashboards yet.`}
                  buttonText="New dashboard"
                  description={`You don’t have any dashboards. As soon as you do, they will start to  appear here.`}
                  onClick={onClickEmptyState}
                  loading={creatingDashboard}
                />
              ) : (
                <></>
              )
            }
          />

          <DashboardSelectedOptionPopup
            selectedRowKeys={selectedDashboardIds}
            onSelectChange={setSelectedDashboardIds}
            hasSelected={selectedDashboardIds.length > 0}
          />
        </div>
      </AppContent>
    </>
  );
};
