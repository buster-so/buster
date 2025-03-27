'use client';

import React, { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardListContent } from './DashboardListContent';
import { AppPageLayout } from '@/components/ui/layouts';
import { useGetDashboardsList } from '@/api/buster_rest/dashboards';

export const DashboardListController: React.FC = () => {
  const [dashboardListFilters, setDashboardListFilters] = useState<{
    shared_with_me?: boolean;
    only_my_dashboards?: boolean;
  }>({});
  const { data: dashboardsList, isFetched: isFetchedDashboardsList } =
    useGetDashboardsList(dashboardListFilters);

  return (
    <AppPageLayout
      headerSizeVariant="list"
      header={
        <DashboardHeader
          dashboardFilters={dashboardListFilters}
          onSetDashboardListFilters={setDashboardListFilters}
        />
      }>
      <DashboardListContent loading={!isFetchedDashboardsList} dashboardsList={dashboardsList} />
    </AppPageLayout>
  );
};
