'use client';

import React, { useContext, useMemo } from 'react';
import { AppContentHeader } from '../_components/AppContentHeader';
import { Breadcrumb, Button, Skeleton } from 'antd';
import Link from 'next/link';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useDashboardContextSelector, useIndividualDashboard } from '@/context/Dashboards';
import { DashboardsListEmitPayload } from '@/api/buster_socket/dashboards';
import { AppMaterialIcons, AppSegmented, AppTooltip } from '@/components';
import isEmpty from 'lodash/isEmpty';
import { useMemoizedFn } from 'ahooks';

export const DashboardHeader: React.FC<{}> = () => {
  const onSetDashboardListFilters = useDashboardContextSelector(
    (state) => state.onSetDashboardListFilters
  );
  const dashboardListFilters = useDashboardContextSelector((state) => state.dashboardListFilters);
  const openedDashboardId = useDashboardContextSelector((state) => state.openedDashboardId);
  const dashboardsList = useDashboardContextSelector((state) => state.dashboardsList);
  const loadedDashboards = useDashboardContextSelector((state) => state.loadedDashboards);
  const onCreateNewDashboard = useDashboardContextSelector((state) => state.onCreateNewDashboard);
  const creatingDashboard = useDashboardContextSelector((state) => state.creatingDashboard);
  const { dashboardResponse } = useIndividualDashboard({ dashboardId: openedDashboardId });
  const dashboardTitle = dashboardResponse?.dashboard?.name || 'Dashboards';

  const showFilters =
    (loadedDashboards && dashboardsList.length !== 0) || !isEmpty(dashboardListFilters);

  const breadcrumbItems = useMemo(
    () => [
      {
        title: (
          <Link
            suppressHydrationWarning
            href={
              openedDashboardId
                ? createBusterRoute({
                    route: BusterRoutes.APP_DASHBOARD_ID,
                    dashboardId: openedDashboardId
                  })
                : createBusterRoute({ route: BusterRoutes.APP_DASHBOARDS })
            }>
            {dashboardTitle}
          </Link>
        )
      }
    ],
    [openedDashboardId, dashboardTitle]
  );

  const onClickNewDashboardButton = useMemoizedFn(async () => {
    await onCreateNewDashboard({ rerouteToDashboard: true });
  });

  return (
    <>
      <AppContentHeader className="items-center justify-between space-x-2">
        <div className="flex space-x-3">
          <Breadcrumb className="flex items-center" items={breadcrumbItems} />
          {showFilters && (
            <DashboardFilters
              activeFilters={dashboardListFilters}
              onChangeFilter={onSetDashboardListFilters}
            />
          )}
        </div>

        <div className="flex items-center">
          <Button
            type="default"
            icon={<AppMaterialIcons icon="add" />}
            loading={creatingDashboard}
            onClick={onClickNewDashboardButton}>
            New Dashboard
          </Button>
        </div>
      </AppContentHeader>
    </>
  );
};

const DashboardFilters: React.FC<{
  onChangeFilter: (v: { shared_with_me?: boolean; only_my_dashboards?: boolean }) => void;
  activeFilters?: DashboardsListEmitPayload['payload']['filters'];
}> = ({ onChangeFilter, activeFilters }) => {
  const filters = [
    {
      label: 'All ',
      value: JSON.stringify({})
    },
    {
      label: 'My dashboards',
      value: JSON.stringify({
        only_my_dashboards: true
      })
    },
    {
      label: 'Shared with me',
      value: JSON.stringify({
        shared_with_me: true
      })
    }
  ];
  const selectedFilter =
    filters.find((filter) => {
      return JSON.stringify(activeFilters) === filter.value;
    }) || filters[0];

  return (
    <div className="flex items-center space-x-1">
      <AppSegmented
        options={filters}
        value={selectedFilter?.value}
        onChange={(v) => {
          const parsedValue = JSON.parse(v as string) as {
            shared_with_me?: boolean;
            only_my_dashboards?: boolean;
          };
          onChangeFilter(parsedValue);
        }}
      />
    </div>
  );
};
