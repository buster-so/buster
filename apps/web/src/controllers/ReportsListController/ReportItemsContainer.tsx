'use client';

import React, { memo, useMemo, useRef, useState } from 'react';
import { FavoriteStar } from '@/components/features/list';
import { getShareStatus } from '@/components/features/metrics/StatusBadgeIndicator';
import { Avatar } from '@/components/ui/avatar';
import type { BusterListColumn, BusterListRowItem } from '@/components/ui/list';
import { BusterList, ListEmptyStateWithButton } from '@/components/ui/list';
import { useCreateListByDate } from '@/components/ui/list/useCreateListByDate';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { formatDate, makeHumanReadble } from '@/lib';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { ReportSelectedOptionPopup } from './ReportItemsSelectedPopup';
import type { ReportListItem } from '@buster/server-shared/reports';

export const ReportItemsContainer: React.FC<{
  reports: ReportListItem[];
  className?: string;
  loading: boolean;
}> = ({ reports = [], className = '', loading }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const renderedDates = useRef<Record<string, string>>({});
  const renderedOwners = useRef<Record<string, React.ReactNode>>({});

  const onSelectChange = useMemoizedFn((selectedRowKeys: string[]) => {
    setSelectedRowKeys(selectedRowKeys);
  });
  const hasSelected = selectedRowKeys.length > 0;

  const reportsRecord = useCreateListByDate({ data: reports, dateKey: 'updated_at' });

  const reportsByDate: BusterListRowItem<ReportListItem>[] = useMemo(() => {
    return Object.entries(reportsRecord).flatMap<BusterListRowItem<ReportListItem>>(
      ([key, reports]) => {
        const records = reports.map<BusterListRowItem<ReportListItem>>((report) => ({
          id: report.id,
          data: report,
          link: createBusterRoute({ route: BusterRoutes.APP_REPORTS_ID, reportId: report.id })
        }));
        const hasRecords = records.length > 0;

        if (!hasRecords) return [];

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
  }, [reportsRecord]);

  const columns: BusterListColumn<ReportListItem>[] = useMemo(
    () => [
      {
        dataIndex: 'name',
        title: 'Name',
        render: (name, record) => <TitleCell name={name} chatId={record?.id} />
      },
      {
        dataIndex: 'updated_at',
        title: 'Last updated',
        width: 132,
        render: (v) => {
          const dateString = String(v);
          if (renderedDates.current[dateString]) {
            return renderedDates.current[dateString];
          }
          const date = formatDate({ date: dateString, format: 'lll' });
          renderedDates.current[dateString] = date;
          return date;
        }
      },
      {
        dataIndex: 'publicly_accessible',
        title: 'Sharing',
        width: 65,
        render: (v, record) => getShareStatus({ is_shared: record.publicly_accessible })
      },
      {
        dataIndex: 'created_by_name',
        title: 'Owner',
        width: 45,
        render: (name, record) => {
          const nameString = String(name || '');
          if (renderedOwners.current[nameString]) {
            return renderedOwners.current[nameString];
          }
          const avatarCell = (
            <OwnerCell name={nameString} image={record?.created_by_avatar || undefined} />
          );
          renderedOwners.current[nameString] = avatarCell;
          return avatarCell;
        }
      }
    ],
    []
  );

  return (
    <>
      <BusterList
        rows={reportsByDate}
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

      <ReportSelectedOptionPopup
        selectedRowKeys={selectedRowKeys}
        onSelectChange={onSelectChange}
        hasSelected={hasSelected}
      />
    </>
  );
};

const EmptyState: React.FC<{
  loading: boolean;
}> = React.memo(({ loading }) => {
  if (loading) return null;

  return (
    <ListEmptyStateWithButton
      title={"You don't have any reports yet."}
      description={'As soon as you create a report (via a chat), it will start to appear here.'}
      buttonText="New chat"
      linkButton={createBusterRoute({ route: BusterRoutes.APP_HOME })}
    />
  );
});
EmptyState.displayName = 'EmptyState';

const TitleCell = React.memo<{ name: string; chatId: string }>(({ name, chatId }) => {
  const onFavoriteDivClick = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  });

  return (
    <div className="flex w-full items-center space-x-2">
      <Text truncate>{name}</Text>
      <div className="mr-2 flex items-center" onClick={onFavoriteDivClick}>
        <FavoriteStar
          id={chatId}
          type={'chat'}
          iconStyle="tertiary"
          title={name}
          className="opacity-0 group-hover:opacity-100"
        />
      </div>
    </div>
  );
});
TitleCell.displayName = 'TitleCell';

const OwnerCell = memo<{ name: string; image: string | undefined }>(({ name, image }) => (
  <div className="flex pl-0">
    <Avatar image={image} name={name} size={18} fallbackClassName="text-2xs" />
  </div>
));
OwnerCell.displayName = 'OwnerCell';
