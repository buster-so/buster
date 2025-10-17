import type React from 'react';
import { useState } from 'react';
import { useGetDashboardsList } from '@/api/buster_rest/dashboards';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { DashboardHeader } from './DashboardHeader';
import { DashboardListContent } from './DashboardListContent';

export const DashboardListController: React.FC = () => {
  const [openNewDashboardModal, setOpenNewDashboardModal] = useState(false);

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
          setOpenNewDashboardModal={setOpenNewDashboardModal}
        />
      }
    >
      <DashboardListContent
        loading={!isFetchedDashboardsList}
        dashboardsList={dashboardsList?.data ?? []}
        openNewDashboardModal={openNewDashboardModal}
        setOpenNewDashboardModal={setOpenNewDashboardModal}
      />
    </AppPageLayout>
  );
};
