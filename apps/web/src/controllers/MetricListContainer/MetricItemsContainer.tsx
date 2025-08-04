import React, { memo, useMemo, useRef, useState } from 'react';
import { type BusterMetricListItem } from '@/api/asset_interfaces';
import { FavoriteStar } from '@/components/features/list';
import { VerificationStatus } from '@buster/server-shared/share';
import {
  getShareStatus,
  StatusBadgeIndicator
} from '@/components/features/metrics/StatusBadgeIndicator';
import { Avatar } from '@/components/ui/avatar';
import type { BusterListColumn, BusterListRowItem } from '@/components/ui/list';
import { BusterList, ListEmptyStateWithButton } from '@/components/ui/list';
import { useCreateListByDate } from '@/components/ui/list/useCreateListByDate';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { formatDate, makeHumanReadble } from '@/lib';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { MetricSelectedOptionPopup } from './MetricItemsSelectedPopup';

export const MetricItemsContainer: React.FC<{
  metrics: BusterMetricListItem[];
  className?: string;
  loading: boolean;
}> = React.memo(({ metrics = [], className = '', loading }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const renderedDates = useRef<Record<string, string>>({});
  const renderedOwners = useRef<Record<string, React.ReactNode>>({});

  const onSelectChange = useMemoizedFn((selectedRowKeys: string[]) => {
    setSelectedRowKeys(selectedRowKeys);
  });
  const hasSelected = selectedRowKeys.length > 0;

  const logsRecord = useCreateListByDate({ data: metrics });

  const metricsByDate: BusterListRowItem<BusterMetricListItem>[] = useMemo(() => {
    return Object.entries(logsRecord).flatMap<BusterListRowItem<BusterMetricListItem>>(
      ([key, metrics]) => {
        const records = metrics.map((metric) => ({
          id: metric.id,
          data: metric,
          link: createBusterRoute({
            route: BusterRoutes.APP_METRIC_ID_CHART,
            metricId: metric.id
          })
        }));
        const hasRecords = records.length > 0;
        if (!hasRecords) {
          return [];
        }
        return [
          {
            id: key,
            data: null,
            rowSection: {
              title: makeHumanReadble(key),
              secondaryTitle: String(records.length)
            }
          },
          ...records
        ];
      }
    );
  }, [logsRecord]);

  const columns: BusterListColumn<BusterMetricListItem>[] = useMemo(
    () => [
      {
        dataIndex: 'name',
        title: 'Name',
        render: (name, record) => (
          <TitleCell name={name} status={record?.status} metricId={record?.id} />
        )
      },
      {
        dataIndex: 'last_edited',
        title: 'Last updated',
        width: 132,
        render: (v) => {
          if (renderedDates.current[v]) {
            return renderedDates.current[v];
          }
          const date = formatDate({ date: v, format: 'lll' });
          renderedDates.current[v] = date;
          return date;
        }
      },
      {
        dataIndex: 'is_shared',
        title: 'Sharing',
        width: 65,
        render: (v) => getShareStatus({ is_shared: v })
      },
      {
        dataIndex: 'created_by_name',
        title: 'Owner',
        width: 45,
        render: (name, record) => {
          if (renderedOwners.current[name]) {
            return renderedOwners.current[name];
          }
          const avatarCell = (
            <OwnerCell name={name} image={record?.created_by_avatar || undefined} />
          );
          renderedOwners.current[name] = avatarCell;
          return avatarCell;
        }
      }
    ],
    []
  );

  return (
    <div
      data-testid="metric-list-container"
      className={`${className} relative flex h-full flex-col items-center`}>
      <BusterList
        rows={metricsByDate}
        columns={columns}
        onSelectChange={onSelectChange}
        selectedRowKeys={selectedRowKeys}
        emptyState={useMemo(
          () => (
            <EmptyState loading={loading} />
          ),
          [loading]
        )}
      />

      <MetricSelectedOptionPopup
        selectedRowKeys={selectedRowKeys}
        onSelectChange={onSelectChange}
        hasSelected={hasSelected}
      />
    </div>
  );
});
MetricItemsContainer.displayName = 'MetricItemsContainer';
const EmptyState: React.FC<{
  loading: boolean;
}> = React.memo(({ loading }) => {
  if (loading) {
    return null;
  }

  return (
    <ListEmptyStateWithButton
      title="You don’t have any metrics yet."
      description="You don’t have any metrics. As soon as you do, they will start to  appear here."
      buttonText="New chat"
      linkButton={createBusterRoute({ route: BusterRoutes.APP_HOME })}
    />
  );
});
EmptyState.displayName = 'EmptyState';

const TitleCell = React.memo<{ name: string; status: VerificationStatus; metricId: string }>(
  ({ name, status, metricId }) => {
    return (
      <div className="mr-2 flex w-full items-center space-x-2">
        <div className="flex items-center justify-center">
          <StatusBadgeIndicator status={status} />
        </div>
        <Text truncate>{name}</Text>
        <FavoriteStar
          id={metricId}
          type={'metric'}
          iconStyle="tertiary"
          title={name}
          className="opacity-0 group-hover:opacity-100"
        />
      </div>
    );
  }
);
TitleCell.displayName = 'TitleCell';

const OwnerCell = memo<{ name: string; image: string | undefined }>(({ name, image }) => (
  <div className="flex pl-0">
    <Avatar image={image} name={name} size={18} />
  </div>
));
OwnerCell.displayName = 'OwnerCell';
