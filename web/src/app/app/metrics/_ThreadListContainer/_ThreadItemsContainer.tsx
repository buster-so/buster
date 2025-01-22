import {
  BusterShareAssetType,
  BusterThreadListItem,
  BusterVerificationStatus
} from '@/api/buster_rest';
import {
  getNow,
  isDateSame,
  isDateBefore,
  isDateAfter,
  makeHumanReadble,
  formatDate
} from '@/utils';
import React, { memo, useMemo, useRef, useState } from 'react';
import { StatusBadgeIndicator, getShareStatus } from '../../_components/Lists';
import { BusterUserAvatar, Text } from '@/components';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useMemoizedFn } from 'ahooks';
import { BusterListColumn, BusterListRow } from '@/components/list';
import { ThreadSelectedOptionPopup } from './_ThreadItemsSelectedPopup';
import { BusterList, ListEmptyStateWithButton } from '@/components/list';
import { FavoriteStar } from '../../_components/Lists';

const createLogRecord = (
  data: BusterThreadListItem[]
): {
  TODAY: BusterThreadListItem[];
  YESTERDAY: BusterThreadListItem[];
  LAST_WEEK: BusterThreadListItem[];
  ALL_OTHERS: BusterThreadListItem[];
} => {
  const today = getNow();
  const TODAY = data.filter((d) =>
    isDateSame({
      date: d.last_edited,
      compareDate: today,
      interval: 'day'
    })
  );
  const YESTERDAY = data.filter((d) =>
    isDateSame({
      date: d.last_edited,
      compareDate: today.subtract(1, 'day'),
      interval: 'day'
    })
  );
  const LAST_WEEK = data.filter(
    (d) =>
      isDateBefore({
        date: d.last_edited,
        compareDate: today.subtract(2, 'day').startOf('day'),
        interval: 'day'
      }) &&
      isDateAfter({
        date: d.last_edited,
        compareDate: today.subtract(8, 'day').startOf('day'),
        interval: 'day'
      })
  );
  const ALL_OTHERS = data.filter(
    (d) => !TODAY.includes(d) && !YESTERDAY.includes(d) && !LAST_WEEK.includes(d)
  );

  return {
    TODAY,
    YESTERDAY,
    LAST_WEEK,
    ALL_OTHERS
  };
};

export const ThreadItemsContainer: React.FC<{
  threads: BusterThreadListItem[];
  className?: string;
  openNewCollectionModal: () => void;
  type: 'logs' | 'threads';
  loading: boolean;
}> = ({ type, threads = [], className = '', loading, openNewCollectionModal }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const renderedDates = useRef<Record<string, string>>({});
  const renderedOwners = useRef<Record<string, React.ReactNode>>({});
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const onSelectChange = useMemoizedFn((selectedRowKeys: string[]) => {
    setSelectedRowKeys(selectedRowKeys);
  });
  const hasSelected = selectedRowKeys.length > 0;

  const logsRecord = useMemo(() => createLogRecord(threads), [threads]);

  const threadsByDate: BusterListRow[] = useMemo(() => {
    return Object.entries(logsRecord).flatMap(([key, threads]) => {
      const records = threads.map((thread) => ({
        id: thread.id,
        data: thread,
        link: createBusterRoute({
          route: BusterRoutes.APP_THREAD_ID,
          threadId: thread.id
        })
      }));
      const hasRecords = records.length > 0;
      if (!hasRecords) {
        return [];
      }
      return [
        {
          id: key,
          data: {},
          rowSection: {
            title: makeHumanReadble(key),
            secondaryTitle: String(records.length)
          }
        },
        ...records
      ];
    });
  }, [logsRecord]);

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        dataIndex: 'title',
        title: 'Title',
        render: (title, record) => (
          <TitleCell title={title} status={record?.status} threadId={record?.id} />
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
      { dataIndex: 'dataset_name', title: 'Dataset', width: 115 },
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
      ref={tableContainerRef}
      className={`${className} relative flex h-full flex-col items-center`}>
      <BusterList
        rows={threadsByDate}
        columns={columns}
        onSelectChange={onSelectChange}
        selectedRowKeys={selectedRowKeys}
        emptyState={
          <EmptyState
            loading={loading}
            type={type}
            openNewCollectionModal={openNewCollectionModal}
          />
        }
      />

      <ThreadSelectedOptionPopup
        selectedRowKeys={selectedRowKeys}
        onSelectChange={onSelectChange}
        hasSelected={hasSelected}
      />
    </div>
  );
};

const EmptyState: React.FC<{
  loading: boolean;
  type: 'logs' | 'threads';
  openNewCollectionModal: () => void;
}> = React.memo(({ loading, type, openNewCollectionModal }) => {
  if (loading) {
    return <></>;
  }

  return <MetricsEmptyState openNewCollectionModal={openNewCollectionModal} type={type} />;
});
EmptyState.displayName = 'EmptyState';

const MetricsEmptyState: React.FC<{
  openNewCollectionModal: () => void;
  type: 'logs' | 'threads';
}> = ({ openNewCollectionModal, type }) => {
  if (type === 'logs') {
    return (
      <ListEmptyStateWithButton
        title="You don’t have any logs yet."
        description="You don’t have any logs. As soon as you do, they will start to appear here."
        buttonText="New metric"
        onClick={openNewCollectionModal}
      />
    );
  }

  return (
    <ListEmptyStateWithButton
      title="You don’t have any metrics yet."
      description="You don’t have any metrics. As soon as you do, they will start to  appear here."
      buttonText="New metric"
      onClick={openNewCollectionModal}
    />
  );
};

const TitleCell = React.memo<{ title: string; status: BusterVerificationStatus; threadId: string }>(
  ({ title, status, threadId }) => {
    const onFavoriteDivClick = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
    });

    return (
      <div className="flex w-full items-center space-x-2">
        <div className="flex items-center justify-center">
          <StatusBadgeIndicator status={status} />
        </div>
        <Text ellipsis={true}>{title}</Text>
        <div
          className="flex items-center opacity-0 group-hover:opacity-100"
          onClick={onFavoriteDivClick}>
          <FavoriteStar
            id={threadId}
            type={BusterShareAssetType.THREAD}
            iconStyle="tertiary"
            name={title}
          />
        </div>
      </div>
    );
  }
);
TitleCell.displayName = 'TitleCell';

const OwnerCell = memo<{ name: string; image: string | null | undefined }>(({ name, image }) => (
  <div className="flex pl-0">
    <BusterUserAvatar image={image || undefined} name={name} size={18} />
  </div>
));
OwnerCell.displayName = 'OwnerCell';
