import type { ReportListItem } from '@buster/server-shared/reports';
import React, { memo, useMemo, useRef, useState } from 'react';
import { FavoriteStar } from '@/components/features/favorites';
import { getShareStatus } from '@/components/features/metrics/StatusBadgeIndicator';
import { Avatar } from '@/components/ui/avatar';
import type { BusterListColumn, BusterListRowItem } from '@/components/ui/list';
import { BusterList, createListItem, ListEmptyStateWithButton } from '@/components/ui/list';
import { useCreateListByDate } from '@/components/ui/list/useCreateListByDate';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { formatDate } from '@/lib/date';
import { makeHumanReadble } from '@/lib/text';
import { ReportSelectedOptionPopup } from './ReportItemsSelectedPopup';

const columns: BusterListColumn<ReportListItem>[] = [
  {
    dataIndex: 'name',
    title: 'Name',
    render: (name, record) => <TitleCell name={name} reportId={record?.id} />,
  },
  {
    dataIndex: 'updated_at',
    title: 'Last updated',
    width: 132,
    render: (v) => {
      const dateString = String(v);
      const date = formatDate({ date: dateString, format: 'lll' });
      return date;
    },
  },
  {
    dataIndex: 'is_shared',
    title: 'Sharing',
    width: 65,
    render: (v) => getShareStatus({ is_shared: v }),
  },
  {
    dataIndex: 'created_by_name',
    title: 'Owner',
    width: 45,
    render: (name, record) => {
      const nameString = String(name || '');
      const avatarCell = (
        <OwnerCell name={nameString} image={record?.created_by_avatar || undefined} />
      );
      return avatarCell;
    },
  },
];

export const ReportItemsContainer: React.FC<{
  reports: ReportListItem[];
  className?: string;
  loading: boolean;
}> = ({ reports = [], loading }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const onSelectChange = useMemoizedFn((selectedRowKeys: string[]) => {
    setSelectedRowKeys(selectedRowKeys);
  });
  const hasSelected = selectedRowKeys.length > 0;

  const reportsRecord = useCreateListByDate({ data: reports, dateKey: 'updated_at' });

  const reportsByDate: BusterListRowItem<ReportListItem>[] = useMemo(() => {
    const createReportLinkItem = createListItem<ReportListItem>();
    return Object.entries(reportsRecord).flatMap<BusterListRowItem<ReportListItem>>(
      ([key, reports]) => {
        const records = reports.map<BusterListRowItem<ReportListItem>>((report) =>
          createReportLinkItem({
            id: report.id,
            data: report,
            link: {
              to: '/app/reports/$reportId',
              params: {
                reportId: report.id,
              },
            },
          })
        );
        const hasRecords = records.length > 0;

        if (!hasRecords) return [];

        return [
          {
            id: key,
            data: null,
            rowSection: {
              title: makeHumanReadble(key),
              secondaryTitle: String(records.length),
            },
          },
          ...records,
        ];
      }
    );
  }, [reportsRecord]);

  return (
    <>
      <BusterList
        rows={reportsByDate}
        columns={columns}
        onSelectChange={onSelectChange}
        selectedRowKeys={selectedRowKeys}
        emptyState={useMemo(() => <EmptyState loading={loading} />, [loading])}
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
      link={{
        to: '/app/home',
      }}
    />
  );
});
EmptyState.displayName = 'EmptyState';

const TitleCell = React.memo<{ name: string; reportId: string }>(({ name, reportId }) => {
  const onFavoriteDivClick = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  });

  return (
    <div className="flex w-full items-center space-x-2">
      <Text truncate>{name}</Text>
      <div className="mr-2 flex items-center" onClick={onFavoriteDivClick}>
        <FavoriteStar
          id={reportId}
          type={'report_file'}
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
