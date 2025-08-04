'use client';

import React, { useMemo, useState } from 'react';
import type { BusterDashboardListItem } from '@/api/asset_interfaces';
import { FavoriteStar } from '@/components/features/list';
import { getShareStatus } from '@/components/features/metrics/StatusBadgeIndicator/helpers';
import { NewDashboardModal } from '@/components/features/modal/NewDashboardModal';
import { Avatar } from '@/components/ui/avatar';
import {
  BusterList,
  type BusterListColumn,
  type BusterListRowItem,
  ListEmptyStateWithButton
} from '@/components/ui/list';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { formatDate } from '@/lib';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { DashboardSelectedOptionPopup } from './DashboardSelectedPopup';

const columns: BusterListColumn<BusterDashboardListItem>[] = [
  {
    dataIndex: 'name',
    title: 'Title',
    render: (data, { id }) => {
      const name = data || 'New Dashboard';
      return (
        <div className="mr-2 flex items-center space-x-1.5">
          <Text truncate>{name}</Text>
          <FavoriteStar
            id={id}
            type={'dashboard'}
            iconStyle="tertiary"
            title={name}
            className="opacity-0 group-hover:opacity-100"
          />
        </div>
      );
    }
  },
  {
    dataIndex: 'last_edited',
    title: 'Last edited',
    width: 140,
    render: (data) => formatDate({ date: data, format: 'lll' })
  },
  {
    dataIndex: 'created_at',
    title: 'Created at',
    width: 140,
    render: (data) => formatDate({ date: data, format: 'lll' })
  },
  {
    dataIndex: 'status',
    title: 'Sharing',
    width: 65,
    render: (_, data) => getShareStatus(data)
  },
  {
    dataIndex: 'owner',
    title: 'Owner',
    width: 55,
    render: (_, data: BusterDashboardListItem) => {
      return <Avatar image={data?.owner?.avatar_url} name={data?.owner?.name} size={18} />;
    }
  }
];

export const DashboardListContent: React.FC<{
  loading: boolean;
  dashboardsList: BusterDashboardListItem[];
  openNewDashboardModal: boolean;
  setOpenNewDashboardModal: (open: boolean) => void;
  className?: string;
}> = React.memo(
  ({
    loading,
    dashboardsList,
    openNewDashboardModal,
    setOpenNewDashboardModal,
    className = ''
  }) => {
    const [selectedDashboardIds, setSelectedDashboardIds] = useState<string[]>([]);

    const rows: BusterListRowItem<BusterDashboardListItem>[] = useMemo(() => {
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
      setOpenNewDashboardModal(true);
    });

    return (
      <div className={`${className} relative flex h-full flex-col items-center`}>
        <BusterList
          rows={rows}
          columns={columns}
          selectedRowKeys={selectedDashboardIds}
          onSelectChange={setSelectedDashboardIds}
          emptyState={
            !loading ? (
              <ListEmptyStateWithButton
                title={'You don’t have any dashboards yet.'}
                buttonText="New dashboard"
                description={
                  'You don’t have any dashboards. As soon as you do, they will start to  appear here.'
                }
                onClick={onClickEmptyState}
              />
            ) : null
          }
        />

        <DashboardSelectedOptionPopup
          selectedRowKeys={selectedDashboardIds}
          onSelectChange={setSelectedDashboardIds}
          hasSelected={selectedDashboardIds.length > 0}
        />

        <NewDashboardModal
          open={openNewDashboardModal}
          onClose={useMemoizedFn(() => setOpenNewDashboardModal(false))}
          useChangePage={true}
        />
      </div>
    );
  }
);

DashboardListContent.displayName = 'DashboardListContent';
