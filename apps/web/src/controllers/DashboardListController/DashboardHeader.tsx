import React from 'react';
import type { dashboardsGetList } from '@/api/buster_rest/dashboards';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { AppSegmented, type SegmentedItem } from '@/components/ui/segmented';
import { Text } from '@/components/ui/typography';

export const DashboardHeader: React.FC<{
  dashboardFilters: {
    shared_with_me?: boolean;
    only_my_dashboards?: boolean;
  };
  onSetDashboardListFilters: (v: {
    shared_with_me?: boolean;
    only_my_dashboards?: boolean;
  }) => void;
  setOpenNewDashboardModal: (open: boolean) => void;
}> = React.memo(({ dashboardFilters, onSetDashboardListFilters, setOpenNewDashboardModal }) => {
  const showFilters = true;

  return (
    <>
      <div className="flex items-center space-x-3">
        <Text>{'Dashboards'}</Text>
        {showFilters && (
          <DashboardFilters
            activeFilters={dashboardFilters}
            onChangeFilter={onSetDashboardListFilters}
          />
        )}
      </div>

      <div className="flex items-center">
        <Button prefix={<Plus />} onClick={() => setOpenNewDashboardModal(true)}>
          New dashboard
        </Button>
      </div>
    </>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

const filters: SegmentedItem<string>[] = [
  {
    label: 'All ',
    value: JSON.stringify({}),
  },
];

const DashboardFilters: React.FC<{
  onChangeFilter: (v: { shared_with_me?: boolean; only_my_dashboards?: boolean }) => void;
  activeFilters?: NonNullable<
    Omit<Parameters<typeof dashboardsGetList>[0], 'page_token' | 'page_size'>
  >;
}> = ({ onChangeFilter, activeFilters }) => {
  const selectedFilter =
    filters.find((filter) => {
      return JSON.stringify(activeFilters) === filter.value;
    }) || filters[0];

  return (
    <div className="flex items-center space-x-1">
      <AppSegmented
        options={filters}
        value={selectedFilter?.value}
        type="button"
        onChange={(v) => {
          const parsedValue = JSON.parse(v.value) as {
            shared_with_me?: boolean;
            only_my_dashboards?: boolean;
          };
          onChangeFilter(parsedValue);
        }}
      />
    </div>
  );
};
